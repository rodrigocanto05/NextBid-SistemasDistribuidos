<?php

require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/NotificationManager.php';
require_once __DIR__ . '/FavoriteManager.php';
require_once __DIR__ . '/ChatManager.php';

class BidManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function placeBid(int $userId, int $productId, float $amount): array {
        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("SELECT prd_start_price, prd_usr_id, prd_status, prd_ends_at, prd_name FROM product WHERE prd_id = ? FOR UPDATE");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();

            if (!$product || $product['prd_status'] !== 'active') {
                $this->pdo->rollBack();
                return ['status' => 'error', 'message' => 'Este leilão já não está ativo.'];
            }

            if (strtotime($product['prd_ends_at']) < time()) {
                $this->pdo->rollBack();
                return ['status' => 'error', 'message' => 'Este leilão já terminou.'];
            }

            if ($product['prd_usr_id'] == $userId) {
                $this->pdo->rollBack();
                return ['status' => 'error', 'message' => 'Não podes licitar no teu próprio leilão.'];
            }

            // ─── Find current highest bid (the one currently in escrow) ──
            $stmt = $this->pdo->prepare(
                "SELECT bid_usr_id, bid_amount
                   FROM bid
                  WHERE bid_prd_id = ?
                  ORDER BY bid_amount DESC, bid_id DESC
                  LIMIT 1"
            );
            $stmt->execute([$productId]);
            $prevHighest = $stmt->fetch(PDO::FETCH_ASSOC); // false if no bids yet

            $minimoNecessario = $prevHighest
                ? (float) $prevHighest['bid_amount']
                : (float) $product['prd_start_price'];

            if ($amount <= $minimoNecessario) {
                $this->pdo->rollBack();
                return ['status' => 'error', 'message' => 'A tua licitação deve ser superior a ' . number_format($minimoNecessario, 2) . '€'];
            }

            // ─── Wallet balance check (with self-refund factored in) ────
            $stmt = $this->pdo->prepare("SELECT usr_balance FROM userss WHERE usr_id = ? FOR UPDATE");
            $stmt->execute([$userId]);
            $balance = (float) $stmt->fetchColumn();

            // If the user is already the current highest bidder, their previous
            // amount will be returned to them, so it counts toward what they can spend.
            $selfRefund = 0.0;
            if ($prevHighest && (int) $prevHighest['bid_usr_id'] === $userId) {
                $selfRefund = (float) $prevHighest['bid_amount'];
            }
            $effectiveBalance = $balance + $selfRefund;

            if ($effectiveBalance < $amount) {
                $this->pdo->rollBack();
                return [
                    'status'   => 'error',
                    'code'     => 'insufficient_funds',
                    'message'  => 'Saldo insuficiente. Tens ' . number_format($effectiveBalance, 2) . '€ disponíveis mas a licitação é de ' . number_format($amount, 2) . '€.',
                    'balance'  => $effectiveBalance,
                    'required' => $amount
                ];
            }

            // ─── Insert new bid ─────────────────────────────────────────
            $stmt = $this->pdo->prepare("INSERT INTO bid (bid_amount, bid_usr_id, bid_prd_id) VALUES (?, ?, ?)");
            $stmt->execute([$amount, $userId, $productId]);

            // ─── Escrow movement: refund previous, debit current ────────
            $depositLog = $this->pdo->prepare(
                "INSERT INTO transactions (tra_usr_id, tra_type, tra_amount, tra_description) VALUES (?, 'deposit', ?, ?)"
            );
            $debitLog = $this->pdo->prepare(
                "INSERT INTO transactions (tra_usr_id, tra_type, tra_amount, tra_description) VALUES (?, 'debit', ?, ?)"
            );
            $balanceUpd = $this->pdo->prepare("UPDATE userss SET usr_balance = usr_balance + ? WHERE usr_id = ?");

            // Refund the previous highest bidder (could be the same user re-bidding higher)
            if ($prevHighest) {
                $prevId  = (int) $prevHighest['bid_usr_id'];
                $prevAmt = (float) $prevHighest['bid_amount'];
                $balanceUpd->execute([$prevAmt, $prevId]);
                $depositLog->execute([
                    $prevId,
                    $prevAmt,
                    $prevId === $userId
                        ? "Reembolso da licitação anterior no leilão #$productId"
                        : "Reembolso por ter sido coberto no leilão #$productId"
                ]);
            }

            // Debit the current bidder
            $balanceUpd->execute([-$amount, $userId]);
            $debitLog->execute([$userId, $amount, "Licitação no leilão #$productId"]);

            atribuirXPAleatorio($this->pdo, $userId, "Licitação no produto #$productId");

            // Read final balance for the bidder so the frontend can update without a refetch
            $stmt = $this->pdo->prepare("SELECT usr_balance FROM userss WHERE usr_id = ?");
            $stmt->execute([$userId]);
            $newBalance = (float) $stmt->fetchColumn();

            $this->pdo->commit();

            // Notify the previous bidder (if it was a different user) AFTER commit
            $notif = new NotificationManager($this->pdo);
            if ($prevHighest && (int) $prevHighest['bid_usr_id'] !== $userId) {
                $notif->create(
                    (int) $prevHighest['bid_usr_id'],
                    "Alguém cobriu a tua oferta em '{$product['prd_name']}'! Nova licitação de " . number_format($amount, 2) . "€. O teu saldo foi reembolsado.",
                    'bid_outbid'
                );
            }

            // Notify users who favorited this auction (skip the bidder and the
            // previous highest, that one already got the outbid notification).
            $favMgr     = new FavoriteManager($this->pdo);
            $watchers   = $favMgr->watchersOf($productId);
            $skipIds    = [$userId];
            if ($prevHighest) $skipIds[] = (int) $prevHighest['bid_usr_id'];
            foreach ($watchers as $watcherId) {
                if (in_array($watcherId, $skipIds, true)) continue;
                $notif->create(
                    $watcherId,
                    "Novo lance em '{$product['prd_name']}' — agora em " . number_format($amount, 2) . "€.",
                    'favorite_bid'
                );
            }

            // Post a system message to the auction chat
            try {
                $stmt = $this->pdo->prepare("SELECT usr_name FROM userss WHERE usr_id = ?");
                $stmt->execute([$userId]);
                $bidderName = (string) ($stmt->fetchColumn() ?: 'Alguém');
                $chat = new ChatManager($this->pdo);
                $chat->sendSystem(
                    $productId,
                    "💰 {$bidderName} licitou " . number_format($amount, 2, ',', '.') . "€"
                );
            } catch (Exception $e) { /* non-fatal */ }

            return [
                'status'      => 'success',
                'message'     => 'Licitação aceite!',
                'new_balance' => $newBalance
            ];

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            return ['status' => 'error', 'message' => 'Erro ao processar: ' . $e->getMessage()];
        }
    }

    public function getByProduct(int $productId, int $limit = 20): array {
        $stmt = $this->pdo->prepare(
            "SELECT b.bid_id, b.bid_amount, b.bid_created_at,
                    u.usr_id AS bidder_id, u.usr_name AS bidder_name, u.usr_photo AS bidder_photo
             FROM bid b
             INNER JOIN userss u ON b.bid_usr_id = u.usr_id
             WHERE b.bid_prd_id = ?
             ORDER BY b.bid_amount DESC, b.bid_created_at DESC
             LIMIT $limit"
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByUser(int $userId, int $limit = 50): array {
        $stmt = $this->pdo->prepare(
            "SELECT b.bid_id, b.bid_amount, b.bid_created_at,
                    p.prd_id, p.prd_name, p.prd_status, p.prd_ends_at,
                    (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS current_highest,
                    (SELECT img_path FROM product_image 
                     WHERE img_prd_id = p.prd_id 
                     ORDER BY img_is_primary DESC, img_id ASC LIMIT 1) AS main_image
             FROM bid b
             INNER JOIN product p ON b.bid_prd_id = p.prd_id
             WHERE b.bid_usr_id = ?
             ORDER BY b.bid_created_at DESC
             LIMIT $limit"
        );
        $stmt->execute([$userId]);
        $bids = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($bids as &$bid) {
            $bid['is_winning'] = (float) $bid['bid_amount'] >= (float) $bid['current_highest'];
        }

        return $bids;
    }
}
<?php
require_once __DIR__ . '/NotificationManager.php';
require_once __DIR__ . '/TransactionManager.php';
require_once __DIR__ . '/ChatManager.php';

function executarLazyCron(PDO $pdo): void
{
    executarLazyCronLeiloes($pdo);
    executarLazyCronFavoritosTerminam($pdo);
}

function executarLazyCronLeiloes(PDO $pdo): void
{
    $notif = new NotificationManager($pdo);
    $tx    = new TransactionManager($pdo);
    $chat  = new ChatManager($pdo);

    $stmt = $pdo->query("SELECT prd_id, prd_name, prd_usr_id FROM product WHERE prd_ends_at < NOW() AND prd_status = 'active'");
    $expiredAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($expiredAuctions as $auction) {
        $id       = (int) $auction['prd_id'];
        $name     = $auction['prd_name'];
        $sellerId = (int) $auction['prd_usr_id'];

        $pdo->beginTransaction();
        try {
            $stmtBid = $pdo->prepare(
                "SELECT bid_usr_id, bid_amount FROM bid WHERE bid_prd_id = ? ORDER BY bid_amount DESC LIMIT 1"
            );
            $stmtBid->execute([$id]);
            $winner = $stmtBid->fetch(PDO::FETCH_ASSOC);

            if ($winner) {
                $winnerId = (int) $winner['bid_usr_id'];
                $amount   = (float) $winner['bid_amount'];

                $pdo->prepare(
                    "UPDATE product SET prd_status = 'sold', prd_winner_usr_id = ? WHERE prd_id = ?"
                )->execute([$winnerId, $id]);

                $pdo->commit();

                // The winner's bid amount was already debited from their wallet
                // when they placed the bid (escrow). Here we only credit the seller.
                $deposit = $tx->deposit($sellerId, $amount, "Venda do leilão #$id - $name");

                if ($deposit['status'] === 'success') {
                    $notif->create($winnerId, "Parabéns! Ganhaste o leilão de $name por " . number_format($amount, 2) . "€!", 'auction_won');
                    $notif->create($sellerId, "O teu leilão de $name foi vendido por " . number_format($amount, 2) . "€!", 'auction_sold');
                    atribuirXPAleatorio($pdo, $winnerId, "Vitória no leilão #$id");

                    // System chat message: winner announcement
                    $winnerName = '';
                    $stmtW = $pdo->prepare("SELECT usr_name FROM userss WHERE usr_id = ?");
                    $stmtW->execute([$winnerId]);
                    $winnerName = (string) ($stmtW->fetchColumn() ?: 'Vencedor');
                    $chat->sendSystem(
                        $id,
                        "🏁 Leilão terminado! Vencedor: {$winnerName} por " . number_format($amount, 2, ',', '.') . "€"
                    );
                } else {
                    $notif->create($sellerId, "O leilão de $name terminou mas houve um erro a creditar o pagamento. Contacta o suporte.", 'auction_payment_failed');
                }
            } else {
                $pdo->prepare("UPDATE product SET prd_status = 'expired' WHERE prd_id = ?")->execute([$id]);
                $pdo->commit();
                $chat->sendSystem($id, "🏁 Leilão terminado sem licitações.");
            }
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("Erro ao fechar leilão $id: " . $e->getMessage());
        }
    }
}

function executarLazyCronFavoritosTerminam(PDO $pdo): void
{
    try {
        $stmt = $pdo->query(
            "SELECT f.fav_usr_id, p.prd_id, p.prd_name, p.prd_ends_at
             FROM product_favorite f
             INNER JOIN product p ON f.fav_prd_id = p.prd_id
             WHERE p.prd_status = 'active'
               AND p.prd_ends_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) return;

        $notif = new NotificationManager($pdo);
        foreach ($rows as $row) {
            $dedupe = "leilão #{$row['prd_id']}";
            $msg    = "O leilão favorito '{$row['prd_name']}' termina em menos de 1 hora!";
            $notif->createOnce(
                (int) $row['fav_usr_id'],
                $msg,
                'favorite_ending',
                $dedupe
            );
        }
    } catch (Exception $e) {
        error_log("Erro no lazy cron de favoritos: " . $e->getMessage());
    }
}

function atribuirXPAleatorio(PDO $pdo, int $userId, string $reason = "Atividade no NextBid"): void
{
    $xp = rand(5, 15);

    $pdo->prepare("UPDATE userss SET usr_xp = usr_xp + :xp WHERE usr_id = :id")
        ->execute(['xp' => $xp, 'id' => $userId]);

    $pdo->prepare("INSERT INTO xp_logs (xpl_usr_id, xpl_amount, xpl_reason) VALUES (?, ?, ?)")
        ->execute([$userId, $xp, $reason]);
}
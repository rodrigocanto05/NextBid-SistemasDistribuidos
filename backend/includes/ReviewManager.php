<?php

class ReviewManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(int $reviewerId, int $productId, int $rating, string $comment = ''): array
    {
        if ($rating < 1 || $rating > 5) {
            return ['status' => 'error', 'message' => 'A avaliação tem de ser entre 1 e 5 estrelas.'];
        }

        $comment = trim($comment);
        if (mb_strlen($comment) > 1000) {
            return ['status' => 'error', 'message' => 'Comentário demasiado longo (máx 1000 caracteres).'];
        }

        $stmt = $this->pdo->prepare(
            "SELECT prd_usr_id, prd_winner_usr_id, prd_status FROM product WHERE prd_id = ?"
        );
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            return ['status' => 'error', 'message' => 'Leilão inexistente.'];
        }

        if (!in_array($product['prd_status'], ['sold', 'ended'])) {
            return ['status' => 'error', 'message' => 'Só podes avaliar leilões concluídos.'];
        }

        if ((int) $product['prd_winner_usr_id'] !== $reviewerId) {
            return ['status' => 'error', 'message' => 'Só o vencedor pode avaliar o vendedor.'];
        }

        $sellerId = (int) $product['prd_usr_id'];

        $stmt = $this->pdo->prepare("SELECT rev_id FROM review WHERE rev_usr_id = ? AND rev_prd_id = ?");
        $stmt->execute([$reviewerId, $productId]);
        if ($stmt->fetch()) {
            return ['status' => 'error', 'message' => 'Já avaliaste este vendedor para este leilão.'];
        }

        try {
            $this->pdo->prepare(
                "INSERT INTO review (rev_usr_id, rev_reviewed_usr_id, rev_prd_id, rev_rating, rev_comment)
                 VALUES (?, ?, ?, ?, ?)"
            )->execute([$reviewerId, $sellerId, $productId, $rating, $comment !== '' ? $comment : null]);

            return ['status' => 'success', 'message' => 'Avaliação registada.'];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Erro ao gravar avaliação.'];
        }
    }

    public function getForSeller(int $sellerId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT r.rev_id, r.rev_rating, r.rev_comment, r.rev_created_at,
                    u.usr_id   AS reviewer_id,
                    u.usr_name AS reviewer_name,
                    u.usr_photo AS reviewer_photo,
                    p.prd_id   AS product_id,
                    p.prd_name AS product_name
             FROM review r
             INNER JOIN userss u ON r.rev_usr_id = u.usr_id
             INNER JOIN product p ON r.rev_prd_id = p.prd_id
             WHERE r.rev_reviewed_usr_id = ?
             ORDER BY r.rev_created_at DESC"
        );
        $stmt->execute([$sellerId]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $this->pdo->prepare(
            "SELECT AVG(rev_rating) AS avg_rating, COUNT(*) AS total
             FROM review WHERE rev_reviewed_usr_id = ?"
        );
        $stmt->execute([$sellerId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'reviews'     => $reviews,
            'avg_rating'  => $stats['avg_rating'] ? round((float) $stats['avg_rating'], 2) : 0,
            'total'       => (int) $stats['total']
        ];
    }

    // Returns the product IDs the user already reviewed, used by frontend
    // to hide the rate button on the auction detail page.
    public function reviewedProductIds(int $reviewerId): array
    {
        $stmt = $this->pdo->prepare("SELECT rev_prd_id FROM review WHERE rev_usr_id = ?");
        $stmt->execute([$reviewerId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function hasReviewed(int $reviewerId, int $productId): bool
    {
        $stmt = $this->pdo->prepare("SELECT 1 FROM review WHERE rev_usr_id = ? AND rev_prd_id = ? LIMIT 1");
        $stmt->execute([$reviewerId, $productId]);
        return (bool) $stmt->fetchColumn();
    }
}
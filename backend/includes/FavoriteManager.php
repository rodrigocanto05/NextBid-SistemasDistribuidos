<?php

class FavoriteManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function toggle(int $userId, int $productId): array
    {
        $stmt = $this->pdo->prepare("SELECT prd_id FROM product WHERE prd_id = ?");
        $stmt->execute([$productId]);
        if (!$stmt->fetch()) {
            return ['status' => 'error', 'message' => 'Leilão não encontrado.'];
        }

        if ($this->isFavorited($userId, $productId)) {
            $this->pdo->prepare("DELETE FROM product_favorite WHERE fav_usr_id = ? AND fav_prd_id = ?")
                ->execute([$userId, $productId]);
            return ['status' => 'success', 'favorited' => false];
        }

        $this->pdo->prepare("INSERT INTO product_favorite (fav_usr_id, fav_prd_id) VALUES (?, ?)")
            ->execute([$userId, $productId]);
        return ['status' => 'success', 'favorited' => true];
    }

    public function isFavorited(int $userId, int $productId): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT 1 FROM product_favorite WHERE fav_usr_id = ? AND fav_prd_id = ? LIMIT 1"
        );
        $stmt->execute([$userId, $productId]);
        return (bool) $stmt->fetchColumn();
    }

    public function listByUser(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT p.*, c.cat_name, f.fav_created_at,
                    (SELECT img_path FROM product_image
                     WHERE img_prd_id = p.prd_id
                     ORDER BY img_is_primary DESC, img_id ASC LIMIT 1) AS main_image,
                    (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS current_bid,
                    (SELECT COUNT(*) FROM bid WHERE bid_prd_id = p.prd_id) AS bid_count
             FROM product_favorite f
             INNER JOIN product p ON f.fav_prd_id = p.prd_id
             INNER JOIN category c ON p.prd_cat_id = c.cat_id
             WHERE f.fav_usr_id = ?
             ORDER BY f.fav_created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function idsByUser(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fav_prd_id FROM product_favorite WHERE fav_usr_id = ?"
        );
        $stmt->execute([$userId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function watchersOf(int $productId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fav_usr_id FROM product_favorite WHERE fav_prd_id = ?"
        );
        $stmt->execute([$productId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }
}

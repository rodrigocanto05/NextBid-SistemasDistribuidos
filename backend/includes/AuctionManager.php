<?php

require_once __DIR__ . '/ChatManager.php';
require_once __DIR__ . '/AttributeManager.php';

class AuctionManager {

    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function createAuction(array $data): int|bool {
        $sql = "INSERT INTO product (
                    prd_name, prd_description, prd_cat_id, prd_condition, 
                    prd_start_price, prd_location, prd_latitude, 
                    prd_longitude, prd_ends_at, prd_usr_id
                ) VALUES (
                    :name, :desc, :cat, :cond, :price, :loc, :lat, :lng, :ends, :uid
                )";

        $stmt = $this->pdo->prepare($sql);
        $res = $stmt->execute([
            ':name'  => $data['name'],
            ':desc'  => $data['description'],
            ':cat'   => $data['category'],
            ':cond'  => $data['condition'],
            ':price' => $data['price'],
            ':loc'   => $data['location'],
            ':lat'   => $data['lat'],
            ':lng'   => $data['long'],
            ':ends'  => $data['ends'],
            ':uid'   => $data['uid']
        ]);

        if (!$res) return false;
        $newId = (int) $this->pdo->lastInsertId();

        try {
            $chat = new ChatManager($this->pdo);
            $chat->sendSystem(
                $newId,
                "🎬 O leilão começou! Preço inicial: " . number_format((float) $data['price'], 2, ',', '.') . "€"
            );
        } catch (Exception $e) { /* non-fatal */ }

        return $newId;
    }

    public function addImage(int $productId, string $path, bool $isPrimary = false): int|bool {
        if ($isPrimary) {
            $this->pdo->prepare("UPDATE product_image SET img_is_primary = 0 WHERE img_prd_id = ?")
                ->execute([$productId]);
        }

        $stmt = $this->pdo->prepare(
            "INSERT INTO product_image (img_path, img_prd_id, img_is_primary) VALUES (?, ?, ?)"
        );
        $ok = $stmt->execute([$path, $productId, $isPrimary ? 1 : 0]);

        return $ok ? (int) $this->pdo->lastInsertId() : false;
    }

    public function getImages(int $productId): array {
        $stmt = $this->pdo->prepare(
            "SELECT img_id, img_path, img_is_primary
             FROM product_image
             WHERE img_prd_id = ?
             ORDER BY img_is_primary DESC, img_id ASC"
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function setPrimaryImage(int $productId, int $imageId): bool {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT img_id FROM product_image WHERE img_id = ? AND img_prd_id = ?");
            $stmt->execute([$imageId, $productId]);
            if (!$stmt->fetch()) {
                $this->pdo->rollBack();
                return false;
            }

            $this->pdo->prepare("UPDATE product_image SET img_is_primary = 0 WHERE img_prd_id = ?")
                ->execute([$productId]);

            $this->pdo->prepare("UPDATE product_image SET img_is_primary = 1 WHERE img_id = ?")
                ->execute([$imageId]);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }

    public function deleteImage(int $imageId): array {
        $stmt = $this->pdo->prepare("SELECT img_prd_id, img_path, img_is_primary FROM product_image WHERE img_id = ?");
        $stmt->execute([$imageId]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$image) {
            return ['status' => 'error', 'message' => 'Imagem não encontrada.', 'path' => null];
        }

        $this->pdo->prepare("DELETE FROM product_image WHERE img_id = ?")->execute([$imageId]);

        if ($image['img_is_primary']) {
            $stmt = $this->pdo->prepare(
                "UPDATE product_image SET img_is_primary = 1
                 WHERE img_prd_id = ?
                 ORDER BY img_id ASC
                 LIMIT 1"
            );
            $stmt->execute([$image['img_prd_id']]);
        }

        return ['status' => 'success', 'path' => $image['img_path']];
    }

    public function getActiveAuctions(?float $userLat = null, ?float $userLng = null, int $raio = 50): array {
        $geoQuery = "";
        $params = [];

        if ($userLat !== null && $userLng !== null) {
            $geoQuery = ", (6371 * acos(cos(radians(:lat)) * cos(radians(prd_latitude)) * cos(radians(prd_longitude) - radians(:lng)) + sin(radians(:lat2)) * sin(radians(prd_latitude)))) AS distance";
            $params["lat"]  = $userLat;
            $params["lat2"] = $userLat;
            $params["lng"]  = $userLng;
            $params["raio"] = $raio;
        }

        $having = ($userLat !== null && $userLng !== null) ? "HAVING distance <= :raio" : "";

        $sql = "SELECT p.*, c.cat_name,
                       (SELECT img_path FROM product_image 
                        WHERE img_prd_id = p.prd_id 
                        ORDER BY img_is_primary DESC, img_id ASC LIMIT 1) AS main_image,
                       (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS current_bid,
                       (SELECT COUNT(*) FROM bid WHERE bid_prd_id = p.prd_id) AS bid_count
                       $geoQuery
                FROM product p
                INNER JOIN category c ON p.prd_cat_id = c.cat_id
                WHERE p.prd_status = 'active' 
                $having
                ORDER BY p.prd_id DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $productId): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT p.*, c.cat_name,
                    u.usr_name AS seller_name, u.usr_photo AS seller_photo,
                    u.usr_id AS seller_id,
                    (SELECT AVG(rev_rating) FROM review WHERE rev_reviewed_usr_id = u.usr_id) AS seller_rating,
                    (SELECT COUNT(*) FROM review WHERE rev_reviewed_usr_id = u.usr_id) AS seller_reviews,
                    (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS current_bid,
                    (SELECT COUNT(*) FROM bid WHERE bid_prd_id = p.prd_id) AS bid_count
             FROM product p
             INNER JOIN category c ON p.prd_cat_id = c.cat_id
             INNER JOIN userss u ON p.prd_usr_id = u.usr_id
             WHERE p.prd_id = ?"
        );
        $stmt->execute([$productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            return null;
        }

        $product['images']     = $this->getImages($productId);
        $product['attributes'] = (new AttributeManager($this->pdo))->getForProduct($productId);

        return $product;
    }

    public function getBySellerId(int $sellerId, ?string $status = null): array {
        $sql = "SELECT p.*, c.cat_name,
                       (SELECT img_path FROM product_image 
                        WHERE img_prd_id = p.prd_id 
                        ORDER BY img_is_primary DESC, img_id ASC LIMIT 1) AS main_image,
                       (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS current_bid
                FROM product p
                INNER JOIN category c ON p.prd_cat_id = c.cat_id
                WHERE p.prd_usr_id = ?";

        $params = [$sellerId];

        if ($status !== null) {
            $sql .= " AND p.prd_status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY p.prd_created_at DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByWinnerId(int $winnerId): array {
        $stmt = $this->pdo->prepare(
            "SELECT p.*, c.cat_name, u.usr_name AS seller_name,
                    (SELECT img_path FROM product_image 
                     WHERE img_prd_id = p.prd_id 
                     ORDER BY img_is_primary DESC, img_id ASC LIMIT 1) AS main_image,
                    (SELECT MAX(bid_amount) FROM bid WHERE bid_prd_id = p.prd_id) AS final_price
             FROM product p
             INNER JOIN category c ON p.prd_cat_id = c.cat_id
             INNER JOIN userss u ON p.prd_usr_id = u.usr_id
             WHERE p.prd_winner_usr_id = ?
             ORDER BY p.prd_ends_at DESC"
        );
        $stmt->execute([$winnerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Admin-only: hard delete with no ownership/bids checks
    public function adminDelete(int $productId): bool {
        return $this->pdo->prepare("DELETE FROM product WHERE prd_id = ?")->execute([$productId]);
    }

    // Admin-only: set status to any value (bypasses business rules)
    public function adminSetStatus(int $productId, string $status): bool {
        $allowed = ['active', 'ended', 'sold', 'expired', 'cancelled', 'pending'];
        if (!in_array($status, $allowed, true)) return false;
        return $this->pdo->prepare("UPDATE product SET prd_status = ? WHERE prd_id = ?")
            ->execute([$status, $productId]);
    }

    public function cancelAuction(int $productId, int $userId): array {
        $stmt = $this->pdo->prepare("SELECT prd_usr_id, prd_status FROM product WHERE prd_id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            return ['status' => 'error', 'message' => 'Leilão não encontrado.'];
        }

        if ((int) $product['prd_usr_id'] !== $userId) {
            return ['status' => 'error', 'message' => 'Sem permissão.'];
        }

        if ($product['prd_status'] !== 'active') {
            return ['status' => 'error', 'message' => 'Leilão não está ativo.'];
        }

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM bid WHERE bid_prd_id = ?");
        $stmt->execute([$productId]);
        if ((int) $stmt->fetchColumn() > 0) {
            return ['status' => 'error', 'message' => 'Não podes cancelar com licitações.'];
        }

        $this->pdo->prepare("UPDATE product SET prd_status = 'expired' WHERE prd_id = ?")->execute([$productId]);
        return ['status' => 'success', 'message' => 'Leilão cancelado.'];
    }
}
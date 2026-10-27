<?php

class ChatManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getByProduct(int $productId, int $limit = 100): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT c.cht_id, c.cht_content, c.cht_created_at, c.cht_is_system,
                    u.usr_id  AS user_id,
                    u.usr_name AS user_name,
                    u.usr_photo AS user_photo
             FROM chat_message c
             INNER JOIN userss u ON c.cht_usr_id = u.usr_id
             WHERE c.cht_prd_id = ?
             ORDER BY c.cht_created_at ASC, c.cht_id ASC
             LIMIT $limit"
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getNewMessages(int $productId, int $afterId, int $limit = 50): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT c.cht_id, c.cht_content, c.cht_created_at, c.cht_is_system,
                    u.usr_id  AS user_id,
                    u.usr_name AS user_name,
                    u.usr_photo AS user_photo
             FROM chat_message c
             INNER JOIN userss u ON c.cht_usr_id = u.usr_id
             WHERE c.cht_prd_id = ? AND c.cht_id > ?
             ORDER BY c.cht_created_at ASC, c.cht_id ASC
             LIMIT $limit"
        );
        $stmt->execute([$productId, $afterId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function send(int $userId, int $productId, string $content): array
    {
        $content = trim($content);

        if ($content === '') {
            return ['status' => 'error', 'message' => 'Mensagem vazia.'];
        }

        if (mb_strlen($content) > 500) {
            return ['status' => 'error', 'message' => 'Mensagem demasiado longa (máx. 500).'];
        }

        $stmt = $this->pdo->prepare("SELECT prd_id FROM product WHERE prd_id = ?");
        $stmt->execute([$productId]);
        if (!$stmt->fetch()) {
            return ['status' => 'error', 'message' => 'Leilão não encontrado.'];
        }

        $stmt = $this->pdo->prepare(
            "INSERT INTO chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system) VALUES (?, ?, ?, 0)"
        );
        $stmt->execute([$productId, $userId, $content]);

        return [
            'status'  => 'success',
            'message' => 'Mensagem enviada.',
            'cht_id'  => (int) $this->pdo->lastInsertId()
        ];
    }

    /**
     * Insert a system message into the auction chat. The cht_usr_id is set to
     * the auction seller so the existing FK still holds, but cht_is_system = 1
     * tells the frontend to render this as a system event (no avatar, no name).
     */
    public function sendSystem(int $productId, string $content): bool
    {
        $content = trim($content);
        if ($content === '' || mb_strlen($content) > 500) {
            return false;
        }

        $stmt = $this->pdo->prepare("SELECT prd_usr_id FROM product WHERE prd_id = ?");
        $stmt->execute([$productId]);
        $sellerId = (int) ($stmt->fetchColumn() ?: 0);
        if ($sellerId <= 0) return false;

        $stmt = $this->pdo->prepare(
            "INSERT INTO chat_message (cht_prd_id, cht_usr_id, cht_content, cht_is_system) VALUES (?, ?, ?, 1)"
        );
        return $stmt->execute([$productId, $sellerId, $content]);
    }
}

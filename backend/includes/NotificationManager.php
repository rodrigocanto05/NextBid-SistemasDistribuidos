<?php
class NotificationManager {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function create(int $userId, string $message, ?string $type = null): bool {
        $sql = "INSERT INTO notifications (not_usr_id, not_message, not_type) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$userId, $message, $type]);
    }

    public function createOnce(int $userId, string $message, string $type, string $dedupeKey, int $ttlSeconds = 86400): bool {
        $stmt = $this->pdo->prepare(
            "SELECT 1 FROM notifications
             WHERE not_usr_id = ? AND not_type = ? AND not_message LIKE ?
               AND not_created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
             LIMIT 1"
        );
        $stmt->execute([$userId, $type, '%' . $dedupeKey . '%', $ttlSeconds]);
        if ($stmt->fetchColumn()) return false;
        return $this->create($userId, $message, $type);
    }

    public function getAll(int $userId, int $limit = 50): array {
        $sql = "SELECT not_id, not_type, not_message, not_read, not_created_at
                FROM notifications 
                WHERE not_usr_id = ?
                ORDER BY not_created_at DESC
                LIMIT $limit";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsRead(int $ntfId): bool {
        $sql = "UPDATE notifications SET not_read = 1 WHERE not_id = ?";
        return $this->pdo->prepare($sql)->execute([$ntfId]);
    }

    public function markAllAsRead(int $userId): int {
        $stmt = $this->pdo->prepare("UPDATE notifications SET not_read = 1 WHERE not_usr_id = ? AND not_read = 0");
        $stmt->execute([$userId]);
        return $stmt->rowCount();
    }

    public function delete(int $ntfId): bool {
        return $this->pdo->prepare("DELETE FROM notifications WHERE not_id = ?")->execute([$ntfId]);
    }

    public function getOwner(int $ntfId): ?int {
        $stmt = $this->pdo->prepare("SELECT not_usr_id FROM notifications WHERE not_id = ?");
        $stmt->execute([$ntfId]);
        $owner = $stmt->fetchColumn();
        return $owner !== false ? (int) $owner : null;
    }
}
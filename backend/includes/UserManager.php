<?php

class UserManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function register(string $name, string $email, string $password, string $gender, string $birthdate, string $bio, string $location, int $xp): bool
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $role = 'normaluser';

        $sql = "INSERT INTO userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_location, usr_xp, usr_role)
                VALUES (:name, :email, :password, :gender, :birthdate, :bio, :location, :xp, :role)";

        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute([
            'name'      => $name,
            'email'     => $email,
            'password'  => $hash,
            'gender'    => $gender,
            'birthdate' => $birthdate,
            'bio'       => $bio,
            'location'  => $location,
            'xp'        => $xp,
            'role'      => $role
        ]);
    }

    public function login(string $email, string $password): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM userss WHERE usr_email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['usr_password'])) {
            return ['status' => 'error', 'message' => 'Credenciais inválidas. Tente novamente.'];
        }

        try {
            $token     = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

            $this->pdo->prepare(
                "INSERT INTO auth_tokens (tok_usr_id, tok_token, tok_expires_at) VALUES (?, ?, ?)"
            )->execute([$user['usr_id'], $token, $expiresAt]);

            return [
                'status'     => 'success',
                'token'      => $token,
                'expires_at' => $expiresAt,
                'user'       => [
                    'id'       => (int) $user['usr_id'],
                    'name'     => $user['usr_name'],
                    'email'    => $user['usr_email'],
                    'role'     => $user['usr_role'],
                    'xp'       => (int) $user['usr_xp'],
                    'photo'    => $user['usr_photo'],
                    'location' => $user['usr_location'],
                    'wallet'   => (float) ($user['usr_balance'] ?? 0)
                ]
            ];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Erro ao gerar sessão.'];
        }
    }

    public function logout(string $token): bool
    {
        return $this->pdo->prepare("DELETE FROM auth_tokens WHERE tok_token = ?")->execute([$token]);
    }

    public function logoutAll(int $userId): bool
    {
        return $this->pdo->prepare("DELETE FROM auth_tokens WHERE tok_usr_id = ?")->execute([$userId]);
    }

    public function getUserProfile(int $userId): array|bool
    {
        $sql = "SELECT usr_id, usr_name, usr_email, usr_xp, usr_photo, usr_bio, usr_birthdate,
                       usr_balance, usr_location, usr_role, usr_created_at
                FROM userss
                WHERE usr_id = :id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if ($user) {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM product WHERE prd_usr_id = ? AND prd_status = 'active'");
            $stmt->execute([$userId]);
            $user['active_auctions'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM product WHERE prd_usr_id = ?");
            $stmt->execute([$userId]);
            $user['total_published'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM bid WHERE bid_usr_id = ?");
            $stmt->execute([$userId]);
            $user['total_bids'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM product WHERE prd_usr_id = ? AND prd_status = 'sold'");
            $stmt->execute([$userId]);
            $user['total_sold'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM product WHERE prd_winner_usr_id = ?");
            $stmt->execute([$userId]);
            $user['total_won'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT COUNT(DISTINCT bid_prd_id) FROM bid WHERE bid_usr_id = ?");
            $stmt->execute([$userId]);
            $user['total_participated'] = (int) $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("SELECT AVG(rev_rating) FROM review WHERE rev_reviewed_usr_id = ?");
            $stmt->execute([$userId]);
            $avg = $stmt->fetchColumn();
            $user['avg_rating'] = $avg ? round((float) $avg, 2) : null;

            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM review WHERE rev_reviewed_usr_id = ?");
            $stmt->execute([$userId]);
            $user['total_reviews'] = (int) $stmt->fetchColumn();
        }

        return $user;
    }

    public function updatePhoto(int $userId, string $photoPath): bool
    {
        return $this->pdo->prepare("UPDATE userss SET usr_photo = ? WHERE usr_id = ?")
            ->execute([$photoPath, $userId]);
    }

    // Returns the previous photo path (so caller can unlink from disk), or '' if none.
    public function removePhoto(int $userId): string
    {
        $stmt = $this->pdo->prepare("SELECT usr_photo FROM userss WHERE usr_id = ?");
        $stmt->execute([$userId]);
        $old = (string) ($stmt->fetchColumn() ?: '');

        $this->pdo->prepare("UPDATE userss SET usr_photo = NULL WHERE usr_id = ?")->execute([$userId]);
        return $old;
    }

    // Admin-only: hard delete (relies on DB cascade for FK cleanup)
    public function adminDelete(int $userId): bool
    {
        return $this->pdo->prepare("DELETE FROM userss WHERE usr_id = ?")->execute([$userId]);
    }

    // Admin-only: assign role ('admin' or 'normaluser')
    public function setRole(int $userId, string $role): bool
    {
        if (!in_array($role, ['admin', 'normaluser'], true)) return false;
        return $this->pdo->prepare("UPDATE userss SET usr_role = ? WHERE usr_id = ?")
            ->execute([$role, $userId]);
    }
}
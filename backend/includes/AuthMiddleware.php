<?php

class AuthMiddleware
{
    public static function getBearerToken(): ?string
    {
        $auth = '';

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (!$auth && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!$auth && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (!$auth && !empty($_SERVER['Authorization'])) {
            $auth = $_SERVER['Authorization'];
        }

        if (!$auth && !empty($_SERVER['REDIRECT_Authorization'])) {
            $auth = $_SERVER['REDIRECT_Authorization'];
        }

        if (preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    public static function requireAuth(PDO $pdo): array
    {
        $token = self::getBearerToken();

        if (!$token) {
            http_response_code(401);
            exit(json_encode([
                'status' => 'error',
                'message' => 'Token em falta.'
            ]));
        }

        $stmt = $pdo->prepare(
            "SELECT u.usr_id, u.usr_name, u.usr_email, u.usr_role, t.tok_expires_at
             FROM auth_tokens t
             INNER JOIN userss u ON t.tok_usr_id = u.usr_id
             WHERE t.tok_token = ?"
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(401);
            exit(json_encode([
                'status' => 'error',
                'message' => 'Token inválido.'
            ]));
        }

        if (strtotime($row['tok_expires_at']) < time()) {
            $pdo->prepare("DELETE FROM auth_tokens WHERE tok_token = ?")->execute([$token]);
            http_response_code(401);
            exit(json_encode([
                'status' => 'error',
                'message' => 'Sessão expirada. Inicia sessão novamente.'
            ]));
        }

        return [
            'id'    => (int) $row['usr_id'],
            'name'  => $row['usr_name'],
            'email' => $row['usr_email'],
            'role'  => $row['usr_role'],
            'token' => $token
        ];
    }

    public static function requireOwnership(PDO $pdo, int $resourceUserId): array
    {
        $user = self::requireAuth($pdo);

        if ($user['id'] !== $resourceUserId && $user['role'] !== 'admin') {
            http_response_code(403);
            exit(json_encode([
                'status' => 'error',
                'message' => 'Sem permissão para este recurso.'
            ]));
        }

        return $user;
    }

    public static function requireAdmin(PDO $pdo): array
    {
        $user = self::requireAuth($pdo);

        if ($user['role'] !== 'admin') {
            http_response_code(403);
            exit(json_encode([
                'status' => 'error',
                'message' => 'Apenas administradores.'
            ]));
        }

        return $user;
    }
}
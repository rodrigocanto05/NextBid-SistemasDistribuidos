<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/ChatManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$body      = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$productId = (int) ($body['product_id'] ?? 0);
$content   = (string) ($body['content'] ?? '');
$debug     = isset($_GET['debug']) && $_GET['debug'] === '1';

// Check debug mode first, before auth middleware
if ($debug) {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($remote, ['127.0.0.1', '::1'], true)) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'message' => 'Acesso restrito a localhost.']));
    }

    $userId = (int) ($body['user_id'] ?? 0);
    if ($userId <= 0) {
        $stmt = $pdo->query('SELECT usr_id FROM userss ORDER BY usr_id ASC LIMIT 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(500);
            exit(json_encode(['status' => 'error', 'message' => 'Não existe utilizador na base de dados.']));
        }
        $userId = (int) $row['usr_id'];
    }
} else {
    // Normal auth flow
    $user   = AuthMiddleware::requireAuth($pdo);
    $userId = $user['id'];
}

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$chat = new ChatManager($pdo);
echo json_encode($chat->send($userId, $productId, $content));

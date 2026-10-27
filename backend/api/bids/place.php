<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/BidManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body      = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$productId = (int) ($body['product_id'] ?? 0);
$amount    = (float) ($body['amount'] ?? 0);

if ($productId <= 0 || $amount <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'Dados de licitação inválidos.']));
}

$bidMgr = new BidManager($pdo);
echo json_encode($bidMgr->placeBid($userId, $productId, $amount));
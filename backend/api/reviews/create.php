<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/ReviewManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user       = AuthMiddleware::requireAuth($pdo);
$reviewerId = $user['id'];

$body      = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$productId = (int) ($body['product_id'] ?? 0);
$rating    = (int) ($body['rating'] ?? 0);
$comment   = (string) ($body['comment'] ?? '');

if ($productId <= 0 || $rating <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'Dados inválidos.']));
}

$revMgr = new ReviewManager($pdo);
echo json_encode($revMgr->create($reviewerId, $productId, $rating, $comment));
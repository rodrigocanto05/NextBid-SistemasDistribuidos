<?php
require_once '../../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../../config/db.php';
require_once '../../../includes/AuctionManager.php';
require_once '../../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body      = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$productId = (int) ($body['product_id'] ?? 0);
$imageId   = (int) ($body['image_id'] ?? 0);

if ($productId <= 0 || $imageId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'IDs inválidos.']));
}

$stmt = $pdo->prepare("SELECT prd_usr_id FROM product WHERE prd_id = ?");
$stmt->execute([$productId]);
$ownerId = $stmt->fetchColumn();

if ((int) $ownerId !== $userId && $user['role'] !== 'admin') {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

$auctionMgr = new AuctionManager($pdo);
$success    = $auctionMgr->setPrimaryImage($productId, $imageId);

echo json_encode([
    'status'  => $success ? 'success' : 'error',
    'message' => $success ? 'Imagem principal definida.' : 'Erro.'
]);

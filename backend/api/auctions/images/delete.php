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

$body    = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$imageId = (int) ($body['image_id'] ?? 0);

if ($imageId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$stmt = $pdo->prepare(
    "SELECT p.prd_usr_id, i.img_prd_id
     FROM product_image i
     INNER JOIN product p ON i.img_prd_id = p.prd_id
     WHERE i.img_id = ?"
);
$stmt->execute([$imageId]);
$row = $stmt->fetch();

if (!$row) {
    exit(json_encode(['status' => 'error', 'message' => 'Imagem não encontrada.']));
}

if ((int) $row['prd_usr_id'] !== $userId && $user['role'] !== 'admin') {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

$stmt = $pdo->prepare("SELECT COUNT(*) FROM product_image WHERE img_prd_id = ?");
$stmt->execute([$row['img_prd_id']]);
$count = (int) $stmt->fetchColumn();

if ($count <= 1) {
    exit(json_encode(['status' => 'error', 'message' => 'O leilão precisa de pelo menos 1 imagem.']));
}

$auctionMgr = new AuctionManager($pdo);
$result     = $auctionMgr->deleteImage($imageId);

if ($result['status'] === 'success' && $result['path']) {
    $filePath = '../../../' . $result['path'];
    if (file_exists($filePath)) {
        @unlink($filePath);
    }
}

echo json_encode([
    'status'  => $result['status'],
    'message' => $result['status'] === 'success' ? 'Imagem removida.' : ($result['message'] ?? 'Erro.')
]);

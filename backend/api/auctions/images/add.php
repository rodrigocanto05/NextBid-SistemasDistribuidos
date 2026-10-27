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

$productId = (int) ($_POST['product_id'] ?? 0);
$isPrimary = !empty($_POST['is_primary']);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID de produto inválido.']));
}

$stmt = $pdo->prepare("SELECT prd_usr_id FROM product WHERE prd_id = ?");
$stmt->execute([$productId]);
$ownerId = $stmt->fetchColumn();

if ($ownerId === false) {
    exit(json_encode(['status' => 'error', 'message' => 'Produto não encontrado.']));
}

if ((int) $ownerId !== $userId && $user['role'] !== 'admin') {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

if (!isset($_FILES['image'])) {
    exit(json_encode(['status' => 'error', 'message' => 'Imagem obrigatória.']));
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($_FILES['image']['type'], $allowedTypes)) {
    exit(json_encode(['status' => 'error', 'message' => 'Formato inválido. Usa JPG, PNG ou WebP.']));
}

if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
    exit(json_encode(['status' => 'error', 'message' => 'Imagem demasiado grande (máx 5 MB).']));
}

$uploadDir = '../../../uploads/products/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$imageName  = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($_FILES['image']['name']));
$uploadFile = $uploadDir . $imageName;

if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile)) {
    exit(json_encode(['status' => 'error', 'message' => 'Erro ao carregar imagem.']));
}

$auctionMgr = new AuctionManager($pdo);
$imageId    = $auctionMgr->addImage($productId, 'uploads/products/' . $imageName, $isPrimary);

if ($imageId) {
    echo json_encode([
        'status'    => 'success',
        'image_id'  => $imageId,
        'path'      => 'uploads/products/' . $imageName
    ]);
} else {
    @unlink($uploadFile);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao gravar na BD.']);
}

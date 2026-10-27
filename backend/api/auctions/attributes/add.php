<?php
require_once '../../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../../config/db.php';
require_once '../../../includes/AttributeManager.php';
require_once '../../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body      = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$productId = (int) ($body['product_id'] ?? 0);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID de produto inválido.']));
}

$stmt = $pdo->prepare("SELECT prd_usr_id FROM product WHERE prd_id = ?");
$stmt->execute([$productId]);
$ownerId = $stmt->fetchColumn();

if ((int) $ownerId !== $userId && $user['role'] !== 'admin') {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Só o vendedor pode adicionar atributos.']));
}

$attrMgr = new AttributeManager($pdo);

if (isset($body['attributes']) && is_array($body['attributes'])) {
    echo json_encode($attrMgr->addMultiple($productId, $body['attributes']));
} else {
    $name  = $body['name']  ?? '';
    $value = $body['value'] ?? '';
    echo json_encode($attrMgr->add($productId, $name, $value));
}
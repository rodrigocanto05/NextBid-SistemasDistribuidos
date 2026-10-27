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

$body        = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$attributeId = (int) ($body['attribute_id'] ?? 0);

if ($attributeId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$stmt = $pdo->prepare(
    "SELECT p.prd_usr_id
     FROM product_attribute a
     INNER JOIN product p ON a.atr_prd_id = p.prd_id
     WHERE a.atr_id = ?"
);
$stmt->execute([$attributeId]);
$ownerId = $stmt->fetchColumn();

if ((int) $ownerId !== $userId && $user['role'] !== 'admin') {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

$attrMgr = new AttributeManager($pdo);
$success = $attrMgr->delete($attributeId);

echo json_encode([
    'status'  => $success ? 'success' : 'error',
    'message' => $success ? 'Atributo removido.' : 'Erro ao remover.'
]);
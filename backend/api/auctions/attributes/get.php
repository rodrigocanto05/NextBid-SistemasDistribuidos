<?php
require_once '../../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../../config/db.php';
require_once '../../../includes/AttributeManager.php';

$productId = (int) ($_GET['product_id'] ?? 0);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$attrMgr    = new AttributeManager($pdo);
$attributes = $attrMgr->getForProduct($productId);

echo json_encode([
    'status'     => 'success',
    'product_id' => $productId,
    'count'      => count($attributes),
    'attributes' => $attributes
]);
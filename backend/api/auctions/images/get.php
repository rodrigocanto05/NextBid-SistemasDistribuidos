<?php
require_once '../../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../../config/db.php';
require_once '../../../includes/AuctionManager.php';

$productId = (int) ($_GET['product_id'] ?? 0);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$auctionMgr = new AuctionManager($pdo);
$images     = $auctionMgr->getImages($productId);

echo json_encode([
    'status' => 'success',
    'count'  => count($images),
    'images' => $images
]);

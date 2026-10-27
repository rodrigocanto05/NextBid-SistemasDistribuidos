<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/AuctionManager.php';
require_once '../../includes/functions.php';

executarLazyCron($pdo);

$productId = (int) ($_GET['product_id'] ?? 0);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$auctionMgr = new AuctionManager($pdo);
$product    = $auctionMgr->getById($productId);

if (!$product) {
    http_response_code(404);
    exit(json_encode(['status' => 'error', 'message' => 'Leilão não encontrado.']));
}

echo json_encode(['status' => 'success', 'data' => $product]);

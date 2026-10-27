<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/BidManager.php';

$productId = (int) ($_GET['product_id'] ?? 0);
$limit     = (int) ($_GET['limit'] ?? 20);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$bidMgr = new BidManager($pdo);
$bids   = $bidMgr->getByProduct($productId, $limit);

echo json_encode([
    'status' => 'success',
    'count'  => count($bids),
    'bids'   => $bids
]);

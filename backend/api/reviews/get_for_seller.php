<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/ReviewManager.php';

$sellerId = (int) ($_GET['seller_id'] ?? 0);

if ($sellerId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$revMgr = new ReviewManager($pdo);
$data   = $revMgr->getForSeller($sellerId);

echo json_encode([
    'status'     => 'success',
    'seller_id'  => $sellerId,
    'avg_rating' => $data['avg_rating'],
    'total'      => $data['total'],
    'reviews'    => $data['reviews']
]);

<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/BidManager.php';
require_once '../../includes/AuthMiddleware.php';

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$limit = (int) ($_GET['limit'] ?? 50);

$bidMgr = new BidManager($pdo);
$bids   = $bidMgr->getByUser($userId, $limit);

echo json_encode([
    'status' => 'success',
    'count'  => count($bids),
    'bids'   => $bids
]);

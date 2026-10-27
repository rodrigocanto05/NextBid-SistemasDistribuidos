<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/AuctionManager.php';
require_once '../../includes/AuthMiddleware.php';

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$auctionMgr = new AuctionManager($pdo);
$auctions   = $auctionMgr->getByWinnerId($userId);

echo json_encode([
    'status'   => 'success',
    'count'    => count($auctions),
    'auctions' => $auctions
]);

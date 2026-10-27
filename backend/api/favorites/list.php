<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/FavoriteManager.php';
require_once '../../includes/AuthMiddleware.php';
require_once '../../includes/functions.php';

executarLazyCron($pdo);

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$favMgr   = new FavoriteManager($pdo);
$auctions = $favMgr->listByUser($userId);

echo json_encode([
    'status'   => 'success',
    'count'    => count($auctions),
    'auctions' => $auctions
]);

<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/FavoriteManager.php';
require_once '../../includes/AuthMiddleware.php';

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$favMgr = new FavoriteManager($pdo);
$ids    = $favMgr->idsByUser($userId);

echo json_encode([
    'status' => 'success',
    'ids'    => $ids
]);

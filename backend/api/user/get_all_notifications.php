<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/NotificationManager.php';
require_once '../../includes/AuthMiddleware.php';

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$limit = (int) ($_GET['limit'] ?? 50);

$notifMgr = new NotificationManager($pdo);
$all      = $notifMgr->getAll($userId, $limit);

$unreadCount = 0;
foreach ($all as $n) {
    if (!$n['not_read']) $unreadCount++;
}

echo json_encode([
    'status'        => 'success',
    'count'         => count($all),
    'unread_count'  => $unreadCount,
    'notifications' => $all
]);

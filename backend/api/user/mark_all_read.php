<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/NotificationManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$notifMgr = new NotificationManager($pdo);
$updated  = $notifMgr->markAllAsRead($userId);

echo json_encode([
    'status'  => 'success',
    'message' => "$updated notificações marcadas como lidas.",
    'updated' => $updated
]);

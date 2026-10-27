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

$body           = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$notificationId = (int) ($body['notificationId'] ?? 0);

if ($notificationId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$notifMgr = new NotificationManager($pdo);
$owner    = $notifMgr->getOwner($notificationId);

if ($owner === null) {
    exit(json_encode(['status' => 'error', 'message' => 'Notificação não encontrada.']));
}

if ($owner !== $userId) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

$success = $notifMgr->delete($notificationId);

echo json_encode([
    'status'  => $success ? 'success' : 'error',
    'message' => $success ? 'Notificação apagada.' : 'Erro ao apagar.'
]);

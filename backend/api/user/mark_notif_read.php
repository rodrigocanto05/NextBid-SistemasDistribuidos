<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/NotificationManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Método não permitido.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body           = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$notificationId = (int) ($body['notificationId'] ?? 0);

if ($notificationId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID de notificação inválido.']));
}

$stmt = $pdo->prepare("SELECT not_usr_id FROM notifications WHERE not_id = ?");
$stmt->execute([$notificationId]);
$ownerId = $stmt->fetchColumn();

if ((int) $ownerId !== $userId) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Sem permissão.']));
}

$notifMgr = new NotificationManager($pdo);

if ($notifMgr->markAsRead($notificationId)) {
    echo json_encode(['status' => 'success', 'message' => 'Notificação lida.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar estado.']);
}
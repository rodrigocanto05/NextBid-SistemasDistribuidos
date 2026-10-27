<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/UserManager.php';
require_once '../../includes/AuthMiddleware.php';

AuthMiddleware::requireAuth($pdo);

$userId = (int) ($_GET['user_id'] ?? 0);

if ($userId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID de utilizador inválido.']));
}

$userMgr = new UserManager($pdo);
$profile = $userMgr->getUserProfile($userId);

if ($profile) {
    echo json_encode(['status' => 'success', 'data' => $profile]);
} else {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Utilizador não encontrado.']);
}
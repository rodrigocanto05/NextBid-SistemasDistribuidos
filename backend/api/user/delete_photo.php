<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/UserManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$userMgr  = new UserManager($pdo);
$oldPhoto = $userMgr->removePhoto($userId);

if ($oldPhoto && file_exists('../../' . $oldPhoto)) {
    @unlink('../../' . $oldPhoto);
}

echo json_encode(['status' => 'success', 'message' => 'Foto removida.']);

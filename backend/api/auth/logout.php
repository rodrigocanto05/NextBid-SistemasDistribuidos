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

$user    = AuthMiddleware::requireAuth($pdo);
$userMgr = new UserManager($pdo);

$userMgr->logout($user['token']);

echo json_encode(['status' => 'success', 'message' => 'Sessão terminada.']);
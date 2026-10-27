<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/CategoryManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

AuthMiddleware::requireAdmin($pdo);

$body = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$name = $body['name'] ?? '';

$catMgr = new CategoryManager($pdo);
echo json_encode($catMgr->create($name));

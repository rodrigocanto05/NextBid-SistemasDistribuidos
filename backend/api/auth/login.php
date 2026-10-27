<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/UserManager.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = $body['email'] ?? '';
$password = $body['password'] ?? '';

if (empty($email) || empty($password)) {
    exit(json_encode(['status' => 'error', 'message' => 'Email e password obrigatórios.']));
}

$userMgr   = new UserManager($pdo);
$resultado = $userMgr->login($email, $password);

if ($resultado['status'] === 'success') {
    echo json_encode($resultado);
} else {
    http_response_code(401);
    echo json_encode($resultado);
}
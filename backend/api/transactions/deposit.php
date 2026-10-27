<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/TransactionManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body        = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$amount      = (float) ($body['amount'] ?? 0);
$description = trim($body['description'] ?? 'Depósito de saldo');

if ($amount <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'Valor inválido.']));
}

$txMgr = new TransactionManager($pdo);
echo json_encode($txMgr->deposit($userId, $amount, $description));
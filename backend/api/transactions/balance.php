<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/TransactionManager.php';
require_once '../../includes/AuthMiddleware.php';

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$txMgr = new TransactionManager($pdo);
echo json_encode([
    'status'  => 'success',
    'user_id' => $userId,
    'balance' => $txMgr->getBalance($userId)
]);
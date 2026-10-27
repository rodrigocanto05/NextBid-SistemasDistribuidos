<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/ChatManager.php';
require_once '../../includes/functions.php';

// Run lazy cron so auction-end system messages get posted on chat polls too
executarLazyCron($pdo);

$productId = (int) ($_GET['product_id'] ?? 0);
$afterId   = (int) ($_GET['after_id'] ?? 0);
$limit     = (int) ($_GET['limit'] ?? 100);

if ($productId <= 0) {
    exit(json_encode(['status' => 'error', 'message' => 'ID inválido.']));
}

$chat = new ChatManager($pdo);

$messages = $afterId > 0
    ? $chat->getNewMessages($productId, $afterId, $limit)
    : $chat->getByProduct($productId, $limit);

$lastId = $afterId;
if (!empty($messages)) {
    $lastId = (int) end($messages)['cht_id'];
}

echo json_encode([
    'status'   => 'success',
    'count'    => count($messages),
    'last_id'  => $lastId,
    'messages' => $messages
]);

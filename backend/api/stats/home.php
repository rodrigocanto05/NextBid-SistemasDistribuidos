<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';

try {
    $active = (int) $pdo->query("SELECT COUNT(*) FROM product WHERE prd_status = 'active'")->fetchColumn();
    $bids   = (int) $pdo->query("SELECT COUNT(*) FROM bid")->fetchColumn();
    $sold   = (int) $pdo->query("SELECT COUNT(*) FROM product WHERE prd_status = 'sold'")->fetchColumn();
    $users  = (int) $pdo->query("SELECT COUNT(*) FROM userss WHERE usr_role = 'normaluser'")->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'active_auctions' => $active,
            'total_bids'      => $bids,
            'sold_auctions'   => $sold,
            'total_users'     => $users,
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao obter estatísticas.']);
}

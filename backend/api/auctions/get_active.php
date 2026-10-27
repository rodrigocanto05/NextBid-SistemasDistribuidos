<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/AuctionManager.php';
require_once '../../includes/functions.php';

executarLazyCron($pdo);

$auctionMgr = new AuctionManager($pdo);

$lat  = isset($_GET['lat']) ? (float) $_GET['lat'] : null;
$lng  = isset($_GET['lng']) ? (float) $_GET['lng'] : null;
$raio = isset($_GET['radius']) ? (int) $_GET['radius'] : 50;

try {
    $auctions = $auctionMgr->getActiveAuctions($lat, $lng, $raio);
    echo json_encode(['status' => 'success', 'count' => count($auctions), 'auctions' => $auctions]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao carregar leilões.']);
}

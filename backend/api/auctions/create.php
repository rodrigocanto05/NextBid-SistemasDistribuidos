<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/AuctionManager.php';
require_once '../../includes/AttributeManager.php';
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Use POST.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

// ─── Validate images array ────────────────────────────────────────────────

if (!isset($_FILES['images']) || !is_array($_FILES['images']['tmp_name'])) {
    exit(json_encode(['status' => 'error', 'message' => 'Mínimo 3 imagens obrigatórias.']));
}

$totalFiles = count(array_filter($_FILES['images']['tmp_name'], fn($t) => $t !== ''));
if ($totalFiles < 3) {
    exit(json_encode(['status' => 'error', 'message' => 'Adiciona pelo menos 3 fotos ao leilão.']));
}
if ($totalFiles > 15) {
    exit(json_encode(['status' => 'error', 'message' => 'Máximo de 15 fotos permitido.']));
}

// ─── Validate text fields ─────────────────────────────────────────────────

$name        = trim($_POST['name'] ?? '');
$description = trim($_POST['description'] ?? '');
$condition   = $_POST['condition'] ?? 'used';
$price       = (float) ($_POST['startPrice'] ?? 0);
$location    = trim($_POST['location'] ?? '');
$lat         = (float) ($_POST['latitude'] ?? 0);
$lng         = (float) ($_POST['longitude'] ?? 0);
$categoryId  = (int) ($_POST['categoryId'] ?? 0);
$endsAt      = $_POST['ends_at'] ?? '';
$currency    = trim($_POST['currency'] ?? 'EUR');

// If no explicit location, fall back to the seller's profile location (district),
// so other users can see where the listing originates.
if ($location === '') {
    $stmt = $pdo->prepare("SELECT usr_location FROM userss WHERE usr_id = ?");
    $stmt->execute([$userId]);
    $location = trim((string) ($stmt->fetchColumn() ?: ''));
}

if ($name === '' || $description === '' || $categoryId <= 0 || empty($endsAt)) {
    exit(json_encode(['status' => 'error', 'message' => 'Preenche todos os campos obrigatórios.']));
}

$validConditions = ['new', 'like new', 'good', 'used'];
if (!in_array($condition, $validConditions)) {
    exit(json_encode(['status' => 'error', 'message' => 'Condição inválida.']));
}

if ($price < 1) {
    exit(json_encode(['status' => 'error', 'message' => 'O preço inicial tem de ser no mínimo 1,00 €.']));
}
if ($price > 1000000) {
    exit(json_encode(['status' => 'error', 'message' => 'O preço inicial não pode exceder 1.000.000 €.']));
}

$endsTimestamp = strtotime($endsAt);
if ($endsTimestamp === false) {
    exit(json_encode(['status' => 'error', 'message' => 'Data de fim inválida.']));
}
if ($endsTimestamp < time() + 3600) {
    exit(json_encode(['status' => 'error', 'message' => 'O leilão tem de durar pelo menos 1 hora.']));
}

// ─── Upload images ────────────────────────────────────────────────────────

$uploadDir = '../../uploads/products/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$allowedTypes  = ['image/jpeg', 'image/png', 'image/webp'];
$uploadedPaths = [];

for ($i = 0; $i < $totalFiles; $i++) {
    $tmpName  = $_FILES['images']['tmp_name'][$i];
    $origName = $_FILES['images']['name'][$i];
    $mimeType = $_FILES['images']['type'][$i];
    $fileSize = $_FILES['images']['size'][$i];

    if ($tmpName === '' || !is_uploaded_file($tmpName)) continue;

    if (!in_array($mimeType, $allowedTypes)) {
        // Clean up already uploaded files
        foreach ($uploadedPaths as $p) @unlink($uploadDir . $p);
        exit(json_encode(['status' => 'error', 'message' => "Foto " . ($i+1) . ": formato inválido. Usa JPG, PNG ou WebP."]));
    }

    if ($fileSize > 5 * 1024 * 1024) {
        foreach ($uploadedPaths as $p) @unlink($uploadDir . $p);
        exit(json_encode(['status' => 'error', 'message' => "Foto " . ($i+1) . " é demasiado grande (máx 5 MB)."]));
    }

    $fileName = time() . '_' . $i . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($origName));
    if (move_uploaded_file($tmpName, $uploadDir . $fileName)) {
        $uploadedPaths[] = $fileName;
    }
}

if (empty($uploadedPaths)) {
    exit(json_encode(['status' => 'error', 'message' => 'Nenhuma imagem foi carregada com sucesso.']));
}

// ─── Create auction ───────────────────────────────────────────────────────

$auctionMgr = new AuctionManager($pdo);

$data = [
    'uid'         => $userId,
    'name'        => $name,
    'description' => $description,
    'condition'   => $condition,
    'price'       => $price,
    'location'    => $location,
    'lat'         => $lat,
    'long'        => $lng,
    'category'    => $categoryId,
    'ends'        => date('Y-m-d H:i:s', $endsTimestamp)
];

$productId = $auctionMgr->createAuction($data);

if (!$productId) {
    foreach ($uploadedPaths as $p) @unlink($uploadDir . $p);
    exit(json_encode(['status' => 'error', 'message' => 'Falha ao criar leilão.']));
}

// ─── Add images (first = primary) ────────────────────────────────────────

foreach ($uploadedPaths as $idx => $fileName) {
    $auctionMgr->addImage($productId, 'uploads/products/' . $fileName, $idx === 0);
}

// ─── Add attributes (size, currency) ─────────────────────────────────────

$attrMgr = new AttributeManager($pdo);

$validCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
if (in_array($currency, $validCurrencies)) {
    $attrMgr->add($productId, 'currency', $currency);
}

// ─── Success ──────────────────────────────────────────────────────────────

echo json_encode([
    'status'  => 'success',
    'message' => 'Leilão criado com sucesso!',
    'id'      => $productId,
    'images'  => count($uploadedPaths)
]);

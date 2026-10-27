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

if (!isset($_FILES['photo'])) {
    exit(json_encode(['status' => 'error', 'message' => 'Foto obrigatória.']));
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($_FILES['photo']['type'], $allowedTypes)) {
    exit(json_encode(['status' => 'error', 'message' => 'Formato inválido. Usa JPG, PNG ou WebP.']));
}

if ($_FILES['photo']['size'] > 3 * 1024 * 1024) {
    exit(json_encode(['status' => 'error', 'message' => 'Imagem demasiado grande (máx 3 MB).']));
}

$uploadDir = '../../uploads/avatars/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$imageName  = 'user' . $userId . '_' . time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($_FILES['photo']['name']));
$uploadFile = $uploadDir . $imageName;
$dbPath     = 'uploads/avatars/' . $imageName;

if (!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadFile)) {
    exit(json_encode(['status' => 'error', 'message' => 'Erro ao carregar foto.']));
}

$stmt = $pdo->prepare("SELECT usr_photo FROM userss WHERE usr_id = ?");
$stmt->execute([$userId]);
$oldPhoto = $stmt->fetchColumn();

$userMgr = new UserManager($pdo);
$success = $userMgr->updatePhoto($userId, $dbPath);

if ($success) {
    if ($oldPhoto && file_exists('../../' . $oldPhoto)) {
        @unlink('../../' . $oldPhoto);
    }
    echo json_encode([
        'status'  => 'success',
        'message' => 'Foto atualizada.',
        'photo'   => $dbPath
    ]);
} else {
    @unlink($uploadFile);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao gravar na BD.']);
}

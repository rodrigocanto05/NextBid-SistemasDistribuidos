<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once "../../config/db.php";
require_once '../../includes/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Método não autorizado.']));
}

$user   = AuthMiddleware::requireAuth($pdo);
$userId = $user['id'];

$body        = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$newEmail    = isset($body['email']) ? filter_var($body['email'], FILTER_VALIDATE_EMAIL) : '';
$newPass     = $body['password'] ?? '';
$newBio      = isset($body['bio']) ? trim(strip_tags($body['bio'])) : '';
$newLocation = isset($body['location']) ? trim(strip_tags($body['location'])) : '';
$newName     = isset($body['name']) ? trim(strip_tags($body['name'])) : '';

if (empty($newEmail) && empty($newPass) && empty($newBio) && empty($newLocation) && empty($newName)) {
    exit(json_encode(['status' => 'error', 'message' => 'Indica pelo menos um campo para atualizar.']));
}

if (!empty($newPass) && strlen($newPass) < 8) {
    exit(json_encode(['status' => 'error', 'message' => 'A password deve ter no mínimo 8 caracteres.']));
}

if (!empty($newName) && (strlen($newName) < 2 || strlen($newName) > 80)) {
    exit(json_encode(['status' => 'error', 'message' => 'Nome deve ter entre 2 e 80 caracteres.']));
}

if (!empty($newBio) && (strlen($newBio) < 10 || strlen($newBio) > 500)) {
    exit(json_encode(['status' => 'error', 'message' => 'Bio deve ter entre 10 e 500 caracteres.']));
}

if (!empty($newLocation) && strlen($newLocation) > 120) {
    exit(json_encode(['status' => 'error', 'message' => 'Localização demasiado longa.']));
}

try {
    $fields = [];
    $params = [];

    if (!empty($newName)) {
        $fields[] = 'usr_name = :name';
        $params['name'] = $newName;
    }

    if (!empty($newEmail)) {
        $fields[] = 'usr_email = :email';
        $params['email'] = $newEmail;
    }

    if (!empty($newPass)) {
        $fields[] = 'usr_password = :password';
        $params['password'] = password_hash($newPass, PASSWORD_BCRYPT);
    }

    if (!empty($newBio)) {
        $fields[] = 'usr_bio = :bio';
        $params['bio'] = $newBio;
    }

    if (!empty($newLocation)) {
        $fields[] = 'usr_location = :location';
        $params['location'] = $newLocation;
    }

    $params['id'] = $userId;
    $sql = "UPDATE userss SET " . implode(', ', $fields) . " WHERE usr_id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['status' => 'success', 'message' => 'Dados atualizados com sucesso!']);
} catch (PDOException $e) {
    http_response_code(400);
    if ($e->getCode() === '23000') {
        echo json_encode(['status' => 'error', 'message' => 'Este email já está em uso.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar.']);
    }
}

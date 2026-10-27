<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once "../../config/db.php";
require_once '../../includes/UserManager.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Método não autorizado.']));
}

$body      = json_decode(file_get_contents('php://input'), true) ?? [];
$name      = trim($body['name'] ?? '');
$email     = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password  = $body['password'] ?? '';
$gender    = $body['gender'] ?? '';
$birthdate = $body['birthdate'] ?? '';
$bio       = trim($body['bio'] ?? '');
$location  = trim($body['location'] ?? '');

if ($name === '' || !$email || $password === '' || $gender === '' || $birthdate === '') {
    exit(json_encode(['status' => 'error', 'message' => 'Todos os campos são obrigatórios.']));
}

if (strlen($name) < 2 || strlen($name) > 80) {
    exit(json_encode(['status' => 'error', 'message' => 'O nome deve ter entre 2 e 80 caracteres.']));
}

if (!in_array($gender, ['M', 'F', 'O'])) {
    exit(json_encode(['status' => 'error', 'message' => 'Género inválido.']));
}

$birthTs = strtotime($birthdate);
if ($birthTs === false) {
    exit(json_encode(['status' => 'error', 'message' => 'Data de nascimento inválida.']));
}

if ($birthTs > time()) {
    exit(json_encode(['status' => 'error', 'message' => 'Data de nascimento não pode ser no futuro.']));
}

$age = (int) ((time() - $birthTs) / (365.25 * 24 * 3600));
if ($age < 18) {
    exit(json_encode(['status' => 'error', 'message' => 'Tens de ter pelo menos 18 anos para te registares.']));
}

if ($age > 120) {
    exit(json_encode(['status' => 'error', 'message' => 'Data de nascimento inválida.']));
}

if (strlen($password) < 8) {
    exit(json_encode(['status' => 'error', 'message' => 'A password deve ter no mínimo 8 caracteres.']));
}

if (strlen($password) > 72) {
    exit(json_encode(['status' => 'error', 'message' => 'A password não pode exceder 72 caracteres.']));
}

if ($bio !== '' && (strlen($bio) < 10 || strlen($bio) > 500)) {
    exit(json_encode(['status' => 'error', 'message' => 'A biografia deve ter entre 10 e 500 caracteres.']));
}

if (strlen($location) > 120) {
    exit(json_encode(['status' => 'error', 'message' => 'Localização demasiado longa (máx 120).']));
}

$xpInicial = rand(10, 50);
$userMgr   = new UserManager($pdo);

try {
    $success = $userMgr->register($name, $email, $password, $gender, $birthdate, $bio, $location, $xpInicial);

    if ($success) {
        echo json_encode([
            'status'  => 'success',
            'message' => 'Bem vindo a NextBid! Ganhaste ' . $xpInicial . ' XP de bónus.',
            'xp'      => $xpInicial
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Falha ao registar.']);
    }
} catch (PDOException $e) {
    http_response_code(400);
    if ($e->getCode() === '23000') {
        echo json_encode(['status' => 'error', 'message' => 'Este email já está em uso.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Erro ao registar.']);
    }
}

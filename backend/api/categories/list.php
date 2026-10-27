<?php
require_once '../../includes/cors.php';
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../includes/CategoryManager.php';

$catMgr = new CategoryManager($pdo);
$cats   = $catMgr->getAll();

echo json_encode([
    'status'     => 'success',
    'count'      => count($cats),
    'categories' => $cats
]);

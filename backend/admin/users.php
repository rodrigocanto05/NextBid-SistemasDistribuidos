<?php
session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: index.php');
    exit;
}
require_once '../config/db.php';
require_once '../includes/UserManager.php';

$userMgr = new UserManager($pdo);

if (isset($_GET['delete'])) {
    $userMgr->adminDelete((int)$_GET['delete']);
    header('Location: users.php');
    exit;
}

if (isset($_GET['toggle_role'])) {
    $id   = (int)$_GET['toggle_role'];
    $cur  = $pdo->prepare("SELECT usr_role FROM userss WHERE usr_id = ?");
    $cur->execute([$id]);
    $role = $cur->fetchColumn();
    $userMgr->setRole($id, $role === 'admin' ? 'normaluser' : 'admin');
    header('Location: users.php');
    exit;
}

$users = $pdo->query("
    SELECT u.usr_id, u.usr_name, u.usr_email, u.usr_role, u.usr_xp, u.usr_balance,
           u.usr_location, u.usr_created_at,
           (SELECT COUNT(*) FROM product WHERE prd_usr_id = u.usr_id) as total_auctions,
           (SELECT COUNT(*) FROM bid WHERE bid_usr_id = u.usr_id) as total_bids
    FROM userss u
    ORDER BY u.usr_created_at DESC
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Utilizadores - NextBid Admin</title>
    <link rel="icon" href="../../frontend/img/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="../../frontend/img/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../../frontend/img/favicon-192.png">
    <link rel="stylesheet" href="_admin.css">
    <style>
        .badge-admin { background: #C9A84C; color: #1a1a2e; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        .badge-user { background: transparent; border: 1px solid #666; padding: 3px 10px; border-radius: 20px; font-size: 11px; color: #aaa; }
        .balance { color: #28a745; }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="../../frontend/img/logo-NextBid.png" alt="NextBid" class="logo" style="height: 70px; mix-blend-mode: lighten;">
        <div>
            <a href="dashboard.php">Dashboard</a>
            <a href="users.php" class="active">Utilizadores</a>
            <a href="auctions.php">Leilões</a>
            <a href="categories.php">Categorias</a>
            <a href="reviews.php">Reviews</a>
            <a href="logout.php" class="logout">Sair</a>
        </div>
    </div>
    <div class="container">
        <h2>Gestão de Utilizadores (<?= count($users) ?>)</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Nome</th><th>Email</th><th>Localização</th><th>Role</th>
                    <th>XP</th><th>Saldo</th><th>Leilões</th><th>Bids</th><th>Registado</th><th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($users as $u): ?>
                <tr>
                    <td><?= $u['usr_id'] ?></td>
                    <td><?= htmlspecialchars($u['usr_name']) ?></td>
                    <td><?= htmlspecialchars($u['usr_email']) ?></td>
                    <td><?= htmlspecialchars($u['usr_location'] ?? '-') ?></td>
                    <td><span class="badge-<?= $u['usr_role'] === 'admin' ? 'admin' : 'user' ?>"><?= $u['usr_role'] ?></span></td>
                    <td><?= $u['usr_xp'] ?></td>
                    <td class="balance"><?= number_format($u['usr_balance'], 2) ?>€</td>
                    <td><?= $u['total_auctions'] ?></td>
                    <td><?= $u['total_bids'] ?></td>
                    <td><?= date('d/m/Y', strtotime($u['usr_created_at'])) ?></td>
                    <td>
                        <a href="?toggle_role=<?= $u['usr_id'] ?>" class="btn btn-info">Role</a>
                        <a href="?delete=<?= $u['usr_id'] ?>" class="btn btn-danger" onclick="return confirm('Tens a certeza?')">Apagar</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
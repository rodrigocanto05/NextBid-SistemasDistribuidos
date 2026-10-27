<?php
session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: index.php');
    exit;
}
require_once '../config/db.php';
require_once '../includes/CategoryManager.php';

$catMgr = new CategoryManager($pdo);
$msg    = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'create') {
        $res = $catMgr->create($_POST['name'] ?? '');
        $msg = $res['message'] ?? ($res['status'] === 'success' ? 'Categoria criada.' : 'Erro ao criar.');
    }
    if ($_POST['action'] === 'update') {
        $res = $catMgr->update((int)($_POST['cat_id'] ?? 0), $_POST['name'] ?? '');
        $msg = $res['message'] ?? '';
    }
}

if (isset($_GET['delete'])) {
    $res = $catMgr->delete((int)$_GET['delete']);
    if ($res['status'] === 'success') {
        header('Location: categories.php');
        exit;
    }
    $msg = $res['message'];
}

// admin page needs product counts (Manager.getAll only returns active_count)
$categories = $pdo->query("
    SELECT c.cat_id, c.cat_name,
           (SELECT COUNT(*) FROM product WHERE prd_cat_id = c.cat_id) as total_products,
           (SELECT COUNT(*) FROM product WHERE prd_cat_id = c.cat_id AND prd_status = 'active') as active_products
    FROM category c
    ORDER BY c.cat_name
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Categorias - NextBid Admin</title>
    <link rel="icon" href="../../frontend/img/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="../../frontend/img/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../../frontend/img/favicon-192.png">
    <link rel="stylesheet" href="_admin.css">
    <style>
        .container { max-width: 1000px; }
        .form-box { background: #16213e; padding: 20px; border-radius: 10px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }
        .form-box input { padding: 10px; border: 1px solid #0f3460; background: #0f3460; color: white; border-radius: 5px; flex: 1; }
        .form-box button { padding: 10px 20px; background: #C9A84C; color: #1a1a2e; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-info { cursor: pointer; border: none; }
        .msg { background: #0f3460; padding: 10px 20px; border-radius: 5px; margin-bottom: 15px; color: #C9A84C; }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="../../frontend/img/logo-NextBid.png" alt="NextBid" class="logo" style="height: 70px; mix-blend-mode: lighten;">
        <div>
            <a href="dashboard.php">Dashboard</a>
            <a href="users.php">Utilizadores</a>
            <a href="auctions.php">Leilões</a>
            <a href="categories.php" class="active">Categorias</a>
            <a href="reviews.php">Reviews</a>
            <a href="logout.php" class="logout">Sair</a>
        </div>
    </div>
    <div class="container">
        <h2>Gestão de Categorias (<?= count($categories) ?>)</h2>
        <?php if ($msg): ?><div class="msg"><?= $msg ?></div><?php endif; ?>
        <form method="POST" class="form-box">
            <input type="hidden" name="action" value="create">
            <input type="text" name="name" placeholder="Nome da nova categoria" required>
            <button type="submit">Criar</button>
        </form>
        <table>
            <thead><tr><th>ID</th><th>Nome</th><th>Produtos</th><th>Ativos</th><th>Ações</th></tr></thead>
            <tbody>
                <?php foreach ($categories as $c): ?>
                <tr>
                    <td><?= $c['cat_id'] ?></td>
                    <td>
                        <form method="POST" style="display: flex; gap: 5px; align-items: center;">
                            <input type="hidden" name="action" value="update">
                            <input type="hidden" name="cat_id" value="<?= $c['cat_id'] ?>">
                            <input type="text" name="name" value="<?= htmlspecialchars($c['cat_name']) ?>" style="background:#0f3460;border:1px solid #333;color:white;padding:5px;border-radius:3px;width:200px;">
                            <button type="submit" class="btn btn-info">Guardar</button>
                        </form>
                    </td>
                    <td><?= $c['total_products'] ?></td>
                    <td><?= $c['active_products'] ?></td>
                    <td>
                        <?php if ($c['total_products'] == 0): ?>
                            <a href="?delete=<?= $c['cat_id'] ?>" class="btn btn-danger" onclick="return confirm('Apagar?')">Apagar</a>
                        <?php else: ?>
                            <span style="color:#666;font-size:12px;">Tem produtos</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
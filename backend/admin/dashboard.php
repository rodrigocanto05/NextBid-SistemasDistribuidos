<?php
session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: index.php');
    exit;
}
require_once '../config/db.php';

$totalUsers     = $pdo->query("SELECT COUNT(*) FROM userss")->fetchColumn();
$activeAuctions = $pdo->query("SELECT COUNT(*) FROM product WHERE prd_status = 'active'")->fetchColumn();
$soldAuctions   = $pdo->query("SELECT COUNT(*) FROM product WHERE prd_status = 'sold'")->fetchColumn();
$expiredAuctions = $pdo->query("SELECT COUNT(*) FROM product WHERE prd_status = 'expired'")->fetchColumn();
$totalBids      = $pdo->query("SELECT COUNT(*) FROM bid")->fetchColumn();
$totalRevenue   = $pdo->query("SELECT COALESCE(SUM(tra_amount), 0) FROM transactions WHERE tra_type = 'deposit'")->fetchColumn();
$totalReviews   = $pdo->query("SELECT COUNT(*) FROM review")->fetchColumn();
$avgRating      = $pdo->query("SELECT COALESCE(ROUND(AVG(rev_rating), 1), 0) FROM review")->fetchColumn();
$totalCategories = $pdo->query("SELECT COUNT(*) FROM category")->fetchColumn();

$catStats = $pdo->query("SELECT c.cat_name, COUNT(p.prd_id) as total FROM product p JOIN category c ON p.prd_cat_id = c.cat_id GROUP BY c.cat_name ORDER BY total DESC")->fetchAll();
$topUsers = $pdo->query("SELECT usr_name, usr_xp FROM userss ORDER BY usr_xp DESC LIMIT 10")->fetchAll();

$bidsByDay = $pdo->query("SELECT DATE(bid_created_at) as dia, COUNT(*) as total FROM bid WHERE bid_created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY dia ORDER BY dia")->fetchAll();

$statusStats = $pdo->query("SELECT prd_status, COUNT(*) as total FROM product GROUP BY prd_status")->fetchAll();

$recentAuctions = $pdo->query("SELECT p.prd_name, p.prd_status, p.prd_start_price, MAX(b.bid_amount) as highest_bid, u.usr_name FROM product p JOIN userss u ON p.prd_usr_id = u.usr_id LEFT JOIN bid b ON p.prd_id = b.bid_prd_id GROUP BY p.prd_id ORDER BY p.prd_created_at DESC LIMIT 5")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - NextBid Admin</title>
    <link rel="icon" href="../../frontend/img/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="../../frontend/img/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../../frontend/img/favicon-192.png">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
    <link rel="stylesheet" href="_admin.css">
    <style>
        .logo { height: 50px; mix-blend-mode: lighten; }
        .section-title { font-size: 13px; text-transform: uppercase; color: #C9A84C; letter-spacing: 2px; margin-bottom: 15px; margin-top: 30px; }
        .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px; }
        .card { background: #16213e; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #0f3460; }
        .card h3 { font-size: 12px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .card p { font-size: 32px; font-weight: bold; color: #C9A84C; }
        .card .sub { font-size: 12px; color: #666; margin-top: 5px; }
        .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .chart-box { background: #16213e; padding: 20px; border-radius: 10px; border: 1px solid #0f3460; }
        .chart-box h3 { margin-bottom: 15px; color: #aaa; font-size: 14px; }
        .full-width { grid-column: 1 / -1; }
        table { background: transparent; border-radius: 0; overflow: visible; }
        td { font-size: 14px; }
        .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; }
        .badge-active { background: #28a745; }
        .badge-sold { background: #C9A84C; color: #1a1a2e; }
        .badge-expired { background: #856404; }
        .badge-ended { background: #6c757d; }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="../../frontend/img/logo-NextBid.png" alt="NextBid" class="logo" style="height: 70px; mix-blend-mode: lighten;">
        <div>
            <a href="dashboard.php" class="active">Dashboard</a>
            <a href="users.php">Utilizadores</a>
            <a href="auctions.php">Leilões</a>
            <a href="categories.php">Categorias</a>
            <a href="reviews.php">Reviews</a>
            <a href="logout.php" class="logout">Sair</a>
        </div>
    </div>
    <div class="container">
        <p class="section-title">Visão Geral</p>
        <div class="cards">
            <div class="card"><h3>Utilizadores</h3><p><?= $totalUsers ?></p></div>
            <div class="card"><h3>Leilões Ativos</h3><p><?= $activeAuctions ?></p></div>
            <div class="card"><h3>Vendidos</h3><p><?= $soldAuctions ?></p></div>
            <div class="card"><h3>Total Licitações</h3><p><?= $totalBids ?></p></div>
            <div class="card"><h3>Receita Total</h3><p><?= number_format($totalRevenue, 0) ?>€</p></div>
        </div>
        <div class="cards">
            <div class="card"><h3>Expirados</h3><p><?= $expiredAuctions ?></p></div>
            <div class="card"><h3>Categorias</h3><p><?= $totalCategories ?></p></div>
            <div class="card"><h3>Reviews</h3><p><?= $totalReviews ?></p><div class="sub">Média: <?= $avgRating ?> ★</div></div>
            <div class="card"><h3>Média Avaliação</h3><p><?= $avgRating ?> ★</p></div>
        </div>

        <p class="section-title">Gráficos</p>
        <div class="charts">
            <div class="chart-box"><h3>Leilões por Categoria</h3><canvas id="catChart"></canvas></div>
            <div class="chart-box"><h3>Top 10 Utilizadores por XP</h3><canvas id="xpChart"></canvas></div>
            <div class="chart-box"><h3>Licitações nos últimos 30 dias</h3><canvas id="bidsChart"></canvas></div>
            <div class="chart-box"><h3>Leilões por Estado</h3><canvas id="statusChart"></canvas></div>
        </div>

        <p class="section-title">Últimos Leilões</p>
        <div class="chart-box">
            <table>
                <thead><tr><th>Produto</th><th>Vendedor</th><th>Preço Inicial</th><th>Maior Bid</th><th>Estado</th></tr></thead>
                <tbody>
                    <?php foreach ($recentAuctions as $a): ?>
                    <tr>
                        <td><?= htmlspecialchars($a['prd_name']) ?></td>
                        <td><?= htmlspecialchars($a['usr_name']) ?></td>
                        <td><?= number_format($a['prd_start_price'], 2) ?>€</td>
                        <td><?= $a['highest_bid'] ? number_format($a['highest_bid'], 2) . '€' : '-' ?></td>
                        <td><span class="badge badge-<?= $a['prd_status'] ?>"><?= $a['prd_status'] ?></span></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
    <script>
        const catColors = ['#C9A84C','#0f3460','#533483','#28a745','#e74c3c','#3498db','#9b59b6','#1abc9c','#f39c12','#e67e22'];
        new Chart(document.getElementById('catChart'), {
            type: 'doughnut',
            data: {
                labels: <?= json_encode(array_column($catStats, 'cat_name')) ?>,
                datasets: [{ data: <?= json_encode(array_column($catStats, 'total')) ?>, backgroundColor: catColors }]
            },
            options: { plugins: { legend: { labels: { color: 'white' } } } }
        });
        new Chart(document.getElementById('xpChart'), {
            type: 'bar',
            data: {
                labels: <?= json_encode(array_column($topUsers, 'usr_name')) ?>,
                datasets: [{ label: 'XP', data: <?= json_encode(array_column($topUsers, 'usr_xp')) ?>, backgroundColor: '#C9A84C' }]
            },
            options: { indexAxis: 'y', scales: { y: { ticks: { color: 'white' } }, x: { ticks: { color: 'white' }, grid: { color: '#333' } } }, plugins: { legend: { display: false } } }
        });
        new Chart(document.getElementById('bidsChart'), {
            type: 'line',
            data: {
                labels: <?= json_encode(array_column($bidsByDay, 'dia')) ?>,
                datasets: [{ label: 'Bids', data: <?= json_encode(array_column($bidsByDay, 'total')) ?>, borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)', fill: true, tension: 0.3 }]
            },
            options: { scales: { y: { ticks: { color: 'white' }, grid: { color: '#333' } }, x: { ticks: { color: 'white', maxRotation: 45 }, grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
        new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: {
                labels: <?= json_encode(array_column($statusStats, 'prd_status')) ?>,
                datasets: [{ data: <?= json_encode(array_column($statusStats, 'total')) ?>, backgroundColor: ['#28a745','#6c757d','#C9A84C','#856404'] }]
            },
            options: { plugins: { legend: { labels: { color: 'white' } } } }
        });
    </script>
</body>
</html>
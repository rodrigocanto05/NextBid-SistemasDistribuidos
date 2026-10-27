<?php
session_start();

if (isset($_SESSION['admin'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once '../config/db.php';
    
    $email    = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM userss WHERE usr_email = ? AND usr_role = 'admin'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['usr_password'])) {
        $_SESSION['admin'] = [
            'id'   => $user['usr_id'],
            'name' => $user['usr_name'],
            'role' => $user['usr_role']
        ];
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Credenciais inválidas ou não tens permissão de admin.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>NextBid Admin</title>
    <link rel="icon" href="../../frontend/img/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="../../frontend/img/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="../../frontend/img/favicon-192.png">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #1a1a2e; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .login-box { background: #16213e; padding: 40px; border-radius: 10px; width: 350px; text-align: center; }
        input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #0f3460; background: #0f3460; color: white; border-radius: 5px; }
        button { width: 100%; padding: 12px; background: #C9A84C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #a8893e; }
        .error { color: #C9A84C; text-align: center; margin-bottom: 15px; font-size: 14px; }
        .logo { width: 150px; margin: 0 auto 25px; mix-blend-mode: lighten; }
    </style>
</head>
<body>
    <div class="login-box">
<img src="../../frontend/img/logo-NextBid.png" alt="NextBid" style="width: 200px; display: block; margin: 0 auto 25px; mix-blend-mode: lighten;">
        <?php if ($error): ?>
            <p class="error"><?= $error ?></p>
        <?php endif; ?>
        <form method="POST">
            <input type="email" name="email" placeholder="Email de admin" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Entrar</button>
        </form>
    </div>
</body>
</html>
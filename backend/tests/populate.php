<?php
require_once '../config/db.php';

/** @var PDO $pdo */

try {
    echo "<h1>A iniciar o povoamento do NextBid...</h1>";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE auth_tokens;");
    $pdo->exec("TRUNCATE TABLE xp_logs;");
    $pdo->exec("TRUNCATE TABLE notifications;");
    $pdo->exec("TRUNCATE TABLE bid;");
    $pdo->exec("TRUNCATE TABLE product_image;");
    $pdo->exec("TRUNCATE TABLE product_attribute;");
    $pdo->exec("TRUNCATE TABLE review;");
    $pdo->exec("TRUNCATE TABLE transactions;");
    $pdo->exec("TRUNCATE TABLE product;");
    $pdo->exec("TRUNCATE TABLE category;");
    $pdo->exec("TRUNCATE TABLE userss;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $pdo->exec("INSERT INTO category (cat_name) VALUES ('Eletrónica'), ('Colecionáveis'), ('Veículos'), ('Moda'), ('Casa'), ('Videojogos'), ('Desporto'), ('Livros'), ('Automóveis')");

    $pass = password_hash('123456', PASSWORD_BCRYPT);
    $passAdmin = password_hash('admin123', PASSWORD_BCRYPT);

    $sqlUser = "INSERT INTO userss (usr_name, usr_email, usr_password, usr_gender, usr_birthdate, usr_bio, usr_location, usr_xp, usr_role, usr_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $pdo->prepare($sqlUser)->execute(['Admin NextBid', 'admin@nextbid.com', $passAdmin, 'M', '1990-01-01', 'Administrador da plataforma.', 'Lisboa', 1000, 'admin', 0]);
    $adminId = $pdo->lastInsertId();

    $pdo->prepare($sqlUser)->execute(['User Alpha', 'alpha@test.com', $pass, 'M', '2000-01-01', 'Colecionador de antiguidades.', 'Lisboa', 100, 'normaluser', 500]);
    $userA = $pdo->lastInsertId();

    $pdo->prepare($sqlUser)->execute(['User Beta', 'beta@test.com', $pass, 'F', '1995-05-15', 'Adoro tecnologia e gaming.', 'Porto', 50, 'normaluser', 1000]);
    $userB = $pdo->lastInsertId();

    $sqlPrd = "INSERT INTO product (
                prd_name, prd_description, prd_cat_id, prd_usr_id,
                prd_condition, prd_start_price, prd_location, prd_latitude, prd_longitude,
                prd_ends_at, prd_status
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $pdo->prepare($sqlPrd)->execute([
        'iPhone Clássico', 'Item de colecionador em bom estado.', 1, $userB,
        'good', 150.00, 'Lisboa', 38.7369, -9.1426,
        date('Y-m-d H:i:s', strtotime('+7 days')), 'active'
    ]);
    $prd1 = $pdo->lastInsertId();

    $pdo->prepare($sqlPrd)->execute([
        'Moeda Rara 1900', 'Moeda de ouro antiga.', 2, $userB,
        'like new', 500.00, 'Lisboa', 38.7400, -9.1500,
        date('Y-m-d H:i:s', strtotime('+2 days')), 'active'
    ]);
    $prd2 = $pdo->lastInsertId();

    $pdo->prepare("INSERT INTO product_image (img_prd_id, img_path, img_is_primary) VALUES (?, ?, 1)")
        ->execute([$prd1, 'uploads/products/sample_iphone.jpg']);

    $pdo->prepare("INSERT INTO product_image (img_prd_id, img_path, img_is_primary) VALUES (?, ?, 1)")
        ->execute([$prd2, 'uploads/products/sample_coin.jpg']);

    $pdo->exec("INSERT INTO xp_level (lvl_number, lvl_xp_required) VALUES
        (1, 0), (2, 100), (3, 250), (4, 500), (5, 1000),
        (6, 2000), (7, 3500), (8, 5500), (9, 8000), (10, 12000),
        (11, 17000), (12, 23000), (13, 30000), (14, 40000), (15, 55000)
        ON DUPLICATE KEY UPDATE lvl_xp_required = VALUES(lvl_xp_required)");

    echo "<h2 style='color: green;'>Base de dados NextBid populada com sucesso!</h2>";
    echo "<p><strong>Users criados:</strong></p>";
    echo "<ul>";
    echo "<li>Admin: admin@nextbid.com / admin123</li>";
    echo "<li>Alpha: alpha@test.com / 123456</li>";
    echo "<li>Beta: beta@test.com / 123456</li>";
    echo "</ul>";

} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Erro ao povoar: " . $e->getMessage() . "</h2>";
}

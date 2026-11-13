<?php
session_start();
$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$_POST['email']]);
$row = $stmt->fetch();
if ($row && password_verify($_POST['password'], $row['password_hash'])) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $row['id'];
    header('Location: /dashboard.php');
    exit;
}

<?php
session_start();
$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$_POST['email']]);
$row = $stmt->fetch();
if ($row && password_verify($_POST['password'], $row['password_hash'])) {
    $_SESSION['user_id'] = $row['id']; // @expect CWE-384
    header('Location: /dashboard.php');
    exit;
}

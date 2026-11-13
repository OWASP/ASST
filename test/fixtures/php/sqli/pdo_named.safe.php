<?php
$pdo = new PDO('mysql:host=localhost;dbname=shop', 'app', getenv('DB_PASS'));
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute(['email' => $_POST['email']]);

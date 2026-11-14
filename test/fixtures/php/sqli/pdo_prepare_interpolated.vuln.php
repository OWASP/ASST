<?php
$pdo = new PDO('mysql:host=localhost;dbname=shop', 'app', getenv('DB_PASS'));
$order = $_GET['sort'];
$stmt = $pdo->prepare("SELECT * FROM products ORDER BY $order"); // @expect CWE-89
$stmt->execute();

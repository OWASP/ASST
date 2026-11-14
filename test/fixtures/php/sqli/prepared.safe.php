<?php
$db = new mysqli('localhost', 'app', getenv('DB_PASS'), 'shop');
$stmt = $db->prepare('SELECT id, email FROM users WHERE name = ?');
$stmt->bind_param('s', $_GET['name']);
$stmt->execute();
$result = $stmt->get_result();

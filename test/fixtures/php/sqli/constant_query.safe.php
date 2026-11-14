<?php
$con = mysqli_connect('localhost', 'app', getenv('DB_PASS'), 'shop');
$count = mysqli_query($con, "SELECT COUNT(*) FROM products");
$sql = 'SELECT id, name FROM categories ORDER BY name';
$db = new mysqli('localhost', 'app', getenv('DB_PASS'), 'shop');
$cats = $db->query($sql);

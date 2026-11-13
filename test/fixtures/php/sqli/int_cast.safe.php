<?php
$con = mysqli_connect('localhost', 'app', getenv('DB_PASS'), 'shop');
$id = (int) $_GET['id'];
$result = mysqli_query($con, "SELECT * FROM products WHERE id = $id");
$page = intval($_GET['page'] ?? 1);
$list = mysqli_query($con, "SELECT * FROM products LIMIT 20 OFFSET " . (($page - 1) * 20));

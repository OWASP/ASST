<?php
$con = mysqli_connect('localhost', 'app', getenv('DB_PASS'), 'shop');
$id = $_GET['id'];
$result = mysqli_query($con, "SELECT name, price FROM products WHERE id = $id"); // @expect CWE-89
while ($row = mysqli_fetch_assoc($result)) {
    echo htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8');
}

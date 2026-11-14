<?php
$con = mysqli_connect('localhost', 'app', getenv('DB_PASS'), 'shop');
$id = mysqli_real_escape_string($con, $_GET['id']);
$result = mysqli_query($con, "SELECT * FROM orders WHERE id = $id"); // @expect CWE-89

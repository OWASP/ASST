<?php
$con = mysqli_connect('localhost', 'app', getenv('DB_PASS'), 'shop');
$name = mysqli_real_escape_string($con, $_GET['name']);
$result = mysqli_query($con, "SELECT id FROM users WHERE name = '$name'");

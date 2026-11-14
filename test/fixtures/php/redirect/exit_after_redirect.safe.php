<?php
session_start();
if (empty($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit;
}
if (!$_SESSION['is_admin']) {
    header('Location: /index.php');
    die;
}
echo 'Admin dashboard';

<?php
define('APP_ROOT', __DIR__ . '/');
require_once APP_ROOT . 'lib/helpers.php';
$id = $_GET['id'];
show_user($db, $id);
$page = $_GET['p'] ?? 'home';
include APP_ROOT . 'pages/' . $page . '.php'; // @expect CWE-98

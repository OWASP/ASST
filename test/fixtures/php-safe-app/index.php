<?php
require_once __DIR__ . '/includes/bootstrap.php';
$allowed = ['home', 'about'];
$page = $_GET['page'] ?? 'home';
if (!in_array($page, $allowed, true)) {
    $page = 'home';
}
include __DIR__ . '/pages/' . $page . '.php';
echo '<p>Hello, ' . e($_GET['name'] ?? 'guest') . '</p>';

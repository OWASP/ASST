<?php
$pages = ['home', 'about', 'contact'];
$p = $_GET['p'] ?? 'home';
if (!in_array($p, $pages, true)) {
    $p = 'home';
}
include __DIR__ . "/pages/$p.php";

<?php
require_once 'config.php';
$page = isset($_GET['page']) ? $_GET['page'] : 'home';
include 'pages/' . $page . '.php'; // @expect CWE-98

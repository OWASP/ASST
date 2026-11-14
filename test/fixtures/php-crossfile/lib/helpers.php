<?php
$db = new mysqli('localhost', 'app', getenv('DB_PASS'), 'shop');

function show_user(mysqli $db, $id)
{
    $result = $db->query("SELECT name FROM users WHERE id = $id"); // @expect CWE-89
    return $result->fetch_assoc();
}

function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

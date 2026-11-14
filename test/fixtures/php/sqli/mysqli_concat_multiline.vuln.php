<?php
function findUser(mysqli $db, $name)
{
    $sql = "SELECT id, email FROM users "
         . "WHERE name = '" . $name . "' "
         . "LIMIT 1";
    return $db->query($sql); // @expect CWE-89
}

$db = new mysqli('localhost', 'app', getenv('DB_PASS'), 'shop');
$user = findUser($db, $_POST['name']);

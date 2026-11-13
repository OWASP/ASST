<?php
session_start();
if (empty($_SESSION['is_admin'])) {
    header('Location: ../login.php'); // @expect CWE-698
}
?>
<h1>Administration</h1>
<a href="purge.php">Purge all orders</a>

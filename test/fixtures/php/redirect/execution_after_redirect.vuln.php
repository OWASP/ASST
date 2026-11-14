<?php
session_start();
if (empty($_SESSION['is_admin'])) {
    header('Location: /login.php'); // @expect CWE-698
}
?>
<h1>Admin panel</h1>
<a href="delete_all_users.php">Delete all users</a>

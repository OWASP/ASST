<?php
session_start();
if (hash_equals($_SESSION['csrf_token'], (string) ($_POST['csrf_token'] ?? ''))) {
    echo 'accepted';
}

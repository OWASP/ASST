<?php
$host = $_POST['host'];
echo '<pre>' . htmlspecialchars((string) shell_exec('ping -c 2 ' . $host), ENT_QUOTES, 'UTF-8') . '</pre>'; // @expect CWE-78

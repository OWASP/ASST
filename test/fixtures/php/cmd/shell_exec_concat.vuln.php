<?php
$target = $_REQUEST['ip'];
$out = shell_exec('ping -c 4 ' . $target); // @expect CWE-78
echo '<pre>' . htmlspecialchars((string) $out, ENT_QUOTES, 'UTF-8') . '</pre>';

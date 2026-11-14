<?php
switch ($_GET['mode'] ?? '') {
    case 'list':
        $level = 'list.php';
        break;
    default:
        $level = 'fixed.php';
}
require __DIR__ . "/levels/$level";
system($cmd); // @expect CWE-78

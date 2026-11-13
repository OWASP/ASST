<?php
$next = $_GET['next'];
header('Location: ' . $next); // @expect CWE-601
exit;

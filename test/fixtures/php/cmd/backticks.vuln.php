<?php
$dir = $_GET['dir'];
$listing = `ls -la $dir`; // @expect CWE-78
echo nl2br(htmlspecialchars($listing, ENT_QUOTES, 'UTF-8'));

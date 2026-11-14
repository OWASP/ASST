<?php
$name = $_GET['file'];
header('Content-Type: application/pdf');
readfile('/var/www/invoices/' . $name); // @expect CWE-22

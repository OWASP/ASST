<?php
ini_set('display_errors', '1'); // @expect CWE-209
$db = mysqli_connect('localhost', 'root', 'toor-Prod-2019', 'shop'); // @expect CWE-798

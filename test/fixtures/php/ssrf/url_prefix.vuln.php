<?php
$status = file_get_contents('https://' . $_GET['host'] . '/health'); // @expect CWE-918

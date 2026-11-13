<?php
$expr = $_GET['expr'];
$result = eval('return ' . $expr . ';'); // @expect CWE-95

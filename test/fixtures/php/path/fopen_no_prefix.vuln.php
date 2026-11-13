<?php
$handle = fopen($_GET['f'], 'r'); // @expect CWE-22|CWE-918

<?php
require __DIR__ . '/lib/helpers.php';
echo '<p>' . e($_GET['name']) . '</p>';
echo '<p>' . $_GET['raw'] . '</p>'; // @expect CWE-79

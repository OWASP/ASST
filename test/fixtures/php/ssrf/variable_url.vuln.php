<?php
$url = $_GET['url'];
$data = file_get_contents($url); // @expect CWE-918|CWE-22

<?php
$xml = simplexml_load_file(__DIR__ . '/users.xml');
$result = $xml->xpath("//user[name='" . $_GET['name'] . "']"); // @expect CWE-643

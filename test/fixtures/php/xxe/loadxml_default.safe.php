<?php
$doc = new DOMDocument();
$doc->loadXML(file_get_contents('php://input'));
$items = simplexml_load_string('<items><item>1</item></items>');

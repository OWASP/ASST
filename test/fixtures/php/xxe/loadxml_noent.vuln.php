<?php
$doc = new DOMDocument();
$doc->loadXML(file_get_contents('php://input'), LIBXML_NOENT); // @expect CWE-611

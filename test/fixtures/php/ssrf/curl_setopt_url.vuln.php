<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $_POST['webhook']); // @expect CWE-918
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$body = curl_exec($ch);

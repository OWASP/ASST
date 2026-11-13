<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $_GET['url']); // @expect CWE-918
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$data = curl_exec($ch);
header('Content-Type: application/json');
echo json_encode(['length' => strlen((string) $data)]);

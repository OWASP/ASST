<?php
$allowed = ['api.example.com', 'cdn.example.com'];
$host = $_GET['host'] ?? '';
if (!in_array($host, $allowed, true)) {
    http_response_code(400);
    exit;
}
$status = file_get_contents('https://' . $host . '/health');

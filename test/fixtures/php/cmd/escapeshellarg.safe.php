<?php
$dir = $_GET['dir'] ?? '.';
system('ls -la ' . escapeshellarg($dir));

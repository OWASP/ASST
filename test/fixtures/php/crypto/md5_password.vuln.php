<?php
$hash = md5($_POST['password']); // @expect CWE-916
$stmt = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
$stmt->execute([$hash, $userId]);

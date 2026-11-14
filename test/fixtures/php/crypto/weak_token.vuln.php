<?php
$token = md5(uniqid(rand(), true)); // @expect CWE-338
$_SESSION['reset_token'] = $token;

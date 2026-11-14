<?php
$hash = password_hash($_POST['password'], PASSWORD_DEFAULT);
if (password_verify($_POST['password'], $hash)) {
    echo 'ok';
}

<?php
session_start();
if ($_POST['csrf_token'] == $_SESSION['csrf_token']) { // @expect CWE-697
    echo 'accepted';
}

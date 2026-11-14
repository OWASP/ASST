<?php
$msg = trim($_POST['message']);
$out = '<p class="note">' . $msg . '</p>';
print $out; // @expect CWE-79

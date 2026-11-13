<?php
$conn = pg_connect('host=localhost dbname=bank user=app');
$res = pg_query($conn, "SELECT * FROM accounts WHERE owner = '" . $_REQUEST['owner'] . "'"); // @expect CWE-89

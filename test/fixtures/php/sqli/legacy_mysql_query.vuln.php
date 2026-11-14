<?php
mysql_connect('localhost', 'app', getenv('DB_PASS'));
mysql_query("DELETE FROM sessions WHERE token = '" . $_COOKIE['token'] . "'"); // @expect CWE-89

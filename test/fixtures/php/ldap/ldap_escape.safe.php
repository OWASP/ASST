<?php
$ds = ldap_connect('ldap://directory.example.com');
$filter = '(uid=' . ldap_escape($_GET['user'], '', LDAP_ESCAPE_FILTER) . ')';
$sr = ldap_search($ds, 'dc=example,dc=com', $filter);

<?php
$ds = ldap_connect('ldap://directory.example.com');
$filter = '(uid=' . $_GET['user'] . ')';
$sr = ldap_search($ds, 'dc=example,dc=com', $filter); // @expect CWE-90

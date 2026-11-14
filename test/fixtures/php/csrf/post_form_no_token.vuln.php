<?php session_start(); ?>
<form method="post" action="transfer.php"> <!-- @expect CWE-352 -->
  <input type="text" name="to">
  <input type="number" name="amount">
  <button type="submit">Send</button>
</form>

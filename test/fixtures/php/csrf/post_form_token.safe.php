<?php session_start(); ?>
<form method="post" action="transfer.php">
  <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
  <input type="text" name="to">
  <button type="submit">Send</button>
</form>

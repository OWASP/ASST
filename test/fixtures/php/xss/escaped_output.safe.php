<?php
echo 'Hello ' . htmlspecialchars($_GET['name'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
?>
<p>Page <?= intval($_GET['page'] ?? 1) ?></p>

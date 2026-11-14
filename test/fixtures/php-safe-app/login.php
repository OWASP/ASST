<?php
require_once __DIR__ . '/includes/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf_token'], (string) ($_POST['csrf_token'] ?? ''))) {
        http_response_code(403);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([(string) ($_POST['email'] ?? '')]);
    $row = $stmt->fetch();
    if ($row && password_verify((string) ($_POST['password'] ?? ''), $row['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $row['id'];
        header('Location: /index.php');
        exit;
    }
}
?>
<form method="post" action="login.php">
  <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
  <input type="email" name="email">
  <input type="password" name="password">
  <button type="submit">Login</button>
</form>

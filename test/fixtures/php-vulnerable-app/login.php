<?php
require_once 'config.php';
session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $_POST['username'];
    $pass = md5($_POST['password']); // @expect CWE-916
    $sql = "SELECT id FROM users WHERE username = '$user' AND password = '$pass'";
    $result = mysqli_query($db, $sql); // @expect CWE-89
    if ($row = mysqli_fetch_assoc($result)) {
        $_SESSION['user_id'] = $row['id']; // @expect CWE-384
        header('Location: index.php');
        exit;
    }
    $error = 'Invalid login for ' . $user;
}
?>
<form method="post" action="login.php"> <!-- @expect CWE-352 -->
  <input name="username">
  <input type="password" name="password">
  <button type="submit">Login</button>
</form>
<?php if (!empty($error)) { echo $error; } ?> <!-- @expect CWE-79 -->

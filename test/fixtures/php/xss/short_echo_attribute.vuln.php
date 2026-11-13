<form method="get" action="search.php">
  <input type="text" name="q" value="<?= $_GET['q'] ?>"> <!-- @expect CWE-79 -->
  <button type="submit">Search</button>
</form>

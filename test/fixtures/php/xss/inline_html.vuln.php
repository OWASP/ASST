<?php $author = $_POST['author']; ?>
<div class="comment">
  <span class="author"><?php echo $author; ?></span> <!-- @expect CWE-79 -->
</div>

<?php function er_settings_form() { ?>
<form method="post" action="options.php">
  <?php settings_fields('er_options'); ?>
  <input name="er_title">
</form>
<?php } ?>

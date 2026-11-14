<?php
unlink('uploads/' . $_POST['filename']); // @expect CWE-22

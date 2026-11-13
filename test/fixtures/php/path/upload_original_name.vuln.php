<?php
move_uploaded_file($_FILES['doc']['tmp_name'], 'uploads/' . $_FILES['doc']['name']); // @expect CWE-22

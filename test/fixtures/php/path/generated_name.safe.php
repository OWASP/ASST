<?php
$target = 'uploads/' . bin2hex(random_bytes(16)) . '.pdf';
move_uploaded_file($_FILES['doc']['tmp_name'], $target);

# Mishandling of exceptional conditions (A10:2025)

Errors and unexpected situations must fail safely: deny access, roll back partial work, and show generic messages while logging the details.

## Error messages shown to users {#error-messages}

Printing database errors or exception messages tells attackers about your queries, tables, paths and versions, and confirms injection attempts.

```php
// Vulnerable
$result = mysqli_query($con, $sql) or die(mysqli_error($con));
echo $e->getMessage();

// Fixed
try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $e) {
    error_log($e->getMessage());           // details for developers
    http_response_code(500);
    exit('Something went wrong. Please try again later.');
}
```

- Use a global exception handler (`set_exception_handler()`) that logs the error and shows a generic page.
- Fail closed: when a check cannot be completed, deny the request.

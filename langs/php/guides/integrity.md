# Software or data integrity failures (A08:2025)

Trusting data or code without checking its integrity, for example deserializing objects from users, can let attackers run code or overwrite program state.

## Insecure deserialization {#deserialization}

`unserialize()` can create objects of any loaded class. With suitable classes ("gadget chains", common in frameworks and libraries), crafted input leads to file writes or code execution.

```php
// Vulnerable
$prefs = unserialize($_COOKIE['prefs']);

// Fixed: use JSON for data exchange
$prefs = json_decode($_COOKIE['prefs'] ?? '{}', true, 16, JSON_THROW_ON_ERROR);
```

If `unserialize()` cannot be avoided, forbid objects and sign the data:

```php
$data = unserialize($payload, ['allowed_classes' => false]);
```

Also verify the integrity of downloaded code and updates (checksums or signatures), and protect CI/CD pipelines.

References: [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html).

## Variable extraction {#variable-extraction}

`extract($_GET)`, `extract($_POST)` and `parse_str($query)` without a result array create local variables from request data. Attackers can then overwrite any variable, such as `$is_admin`.

```php
// Vulnerable
extract($_POST);
parse_str($_SERVER['QUERY_STRING']);

// Fixed: read the values you need explicitly
$name = (string) ($_POST['name'] ?? '');
parse_str($_SERVER['QUERY_STRING'], $query);
```

## Mass assignment {#mass-assignment}

Passing all request fields to a model (`User::create($request->all())`) lets users set attributes they should not control, such as `is_admin`, `balance` or `user_id`.

```php
// Vulnerable
class User extends Model { protected $guarded = []; }
User::create($request->all());

// Fixed: allow-list the fields and use validated data
class User extends Model { protected $fillable = ['name', 'email']; }
User::create($request->validated());
```

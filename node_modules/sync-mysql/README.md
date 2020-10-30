# sync-mysql

Make synchronous queries to a mysql database

[![Build Status](https://img.shields.io/travis/ForbesLindesay/sync-mysql/master.svg)](https://travis-ci.org/ForbesLindesay/sync-mysql)
[![Dependency Status](https://img.shields.io/david/ForbesLindesay/sync-mysql/master.svg)](http://david-dm.org/ForbesLindesay/sync-mysql)
[![NPM version](https://img.shields.io/npm/v/sync-mysql.svg)](https://www.npmjs.org/package/sync-mysql)

## Installation

```
npm install sync-mysql --save
```

## Usage

```js
var MySql = require('sync-mysql');

var connection = new MySql({
  host: 'localhost',
  user: 'me',
  password: 'secret'
});

const result = connection.query('SELECT 1 + 1 AS solution');
assert(result[0].solution === 2);
```

## API

### connection.getRecord(tableName, id)

Assuming that the table passed has an `id` column, get the record with that id.

### connection.query(str, values)

Return an array of objects from a SQL query. The query may optionally contain ?s to be replaced with escaped values from values which should be an array.

### connection.call(name, args)

Call a database procedure. If it returns only one set of values, that set of values is returned as an array of objects. If it returns multiple sets of values then they are returned as an array.

## License

MIT

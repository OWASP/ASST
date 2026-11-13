const mysql = require('mysql2/promise');

const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, database: 'shop' });

exports.findUser = async function (id) {
  const [rows] = await pool.query(`SELECT id, name, bio FROM users WHERE id = ${id}`); // @expect CWE-89
  return rows[0];
};

exports.findOrders = async function (userId) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
  return rows;
};

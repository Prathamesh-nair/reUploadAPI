require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const { Client } = require("pg");

const client = new Client({
  host: process.env.HOST_NAME,
  user: process.env.USER_NAME,
  port: 5432,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

module.exports = client;

const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// Create connection pools
const pools = {
  realmd: mysql.createPool(dbConfig.realmd),
  characters: mysql.createPool(dbConfig.characters),
  world: mysql.createPool(dbConfig.world)
};

module.exports = pools;

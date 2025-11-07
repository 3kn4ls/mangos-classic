// Database configuration
module.exports = {
  // Realmd database (accounts)
  realmd: {
    host: process.env.DB_HOST || 'mysql-service',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mangos',
    password: process.env.DB_PASSWORD || 'mangos',
    database: process.env.REALMD_DB || 'classicrealmd',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  // Characters database
  characters: {
    host: process.env.DB_HOST || 'mysql-service',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mangos',
    password: process.env.DB_PASSWORD || 'mangos',
    database: process.env.CHARACTERS_DB || 'classiccharacters',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  // World database
  world: {
    host: process.env.DB_HOST || 'mysql-service',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mangos',
    password: process.env.DB_PASSWORD || 'mangos',
    database: process.env.WORLD_DB || 'classicmangos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
};

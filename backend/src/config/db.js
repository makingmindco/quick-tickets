// src/config/db.js
const mysql = require('mysql2');

// Cria o pool de conexão (melhor para performance do que conexões únicas)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Seu usuário do phpMyAdmin
    password: '', // Sua senha do phpMyAdmin (deixe vazio se não tiver)
    database: 'quickticket',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Transforma a conexão para aceitar Promises (facilita o uso do async/await)
const promisePool = pool.promise();

module.exports = promisePool;
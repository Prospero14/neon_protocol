import Database from 'better-sqlite3';
const db = new Database('dev.db');
console.log(db.prepare('SELECT username FROM User LIMIT 5').all());

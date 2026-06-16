import Database from 'better-sqlite3';
const db = new Database('dev.db');
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((r) => r.name)
  .filter((n) => n.startsWith('Nri'));
console.log('tables', tables);

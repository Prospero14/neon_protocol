import Database from 'better-sqlite3';
const db = new Database('dev.db');
try {
  console.log('NriNpc schema:', db.prepare('PRAGMA table_info(NriNpc)').all());
  console.log('count:', db.prepare('SELECT COUNT(*) as c FROM NriNpc').get());
} catch (e) {
  console.error('no table', e.message);
}

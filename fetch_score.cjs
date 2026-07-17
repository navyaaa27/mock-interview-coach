const { Client } = require('pg');

const client = new Client({
  host: 'db.oymtdxfzsccgczlqluud.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Guniya#2710',
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT u.id, u.readiness_score, p.full_name FROM users u JOIN profiles p ON u.id = p.user_id WHERE p.full_name ILIKE $1', ['%Priya%']);
    console.log(res.rows);
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

run();

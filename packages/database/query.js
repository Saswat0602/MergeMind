const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Query GitHubSettings
    const settingsRes = await client.query('SELECT * FROM "GitHubSettings" LIMIT 1');
    console.log('=== GITHUB SETTINGS IN DB ===');
    if (settingsRes.rows.length) {
      const s = settingsRes.rows[0];
      console.log({ ...s, privateKey: s.privateKey ? '[REDACTED]' : null });
    } else {
      console.log('None');
    }

    // 2. Query GitHubInstallation
    const instRes = await client.query('SELECT * FROM "GitHubInstallation"');
    console.log('=== GITHUB INSTALLATIONS IN DB ===');
    console.log(instRes.rows.length ? instRes.rows : 'None');

    // 3. Query Repository
    const repoRes = await client.query('SELECT name, "fullName", "isActive" FROM "Repository"');
    console.log('=== REGISTERED REPOSITORIES IN DB ===');
    console.log(repoRes.rows.length ? repoRes.rows : 'None');

    // 4. Query PullRequest
    const prRes = await client.query('SELECT number, title, state, "createdAt" FROM "PullRequest"');
    console.log('=== REGISTERED PRS IN DB ===');
    console.log(prRes.rows.length ? prRes.rows : 'None');

  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  pool.end();
});

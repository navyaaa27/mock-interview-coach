const { Client } = require('pg');

const run = async () => {
  const client = new Client({
    host: 'db.oymtdxfzsccgczlqluud.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Guniya#2710',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    const sql = `
      ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS readiness_threshold integer;
      ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS hard_session_requirement integer;
      ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS min_technical_score numeric;
      ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS min_behavioral_score numeric;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gap_analysis_json jsonb;

      UPDATE company_profiles SET
        readiness_threshold = 88,
        hard_session_requirement = 5,
        min_technical_score = 7.5,
        min_behavioral_score = 7.0
      WHERE company_name = 'Google';

      UPDATE company_profiles SET
        readiness_threshold = 82,
        hard_session_requirement = 3,
        min_technical_score = 6.5,
        min_behavioral_score = 8.0
      WHERE company_name = 'Amazon';

      UPDATE company_profiles SET
        readiness_threshold = 80,
        hard_session_requirement = 3,
        min_technical_score = 7.0,
        min_behavioral_score = 7.0
      WHERE company_name = 'Microsoft';

      UPDATE company_profiles SET
        readiness_threshold = 78,
        hard_session_requirement = 2,
        min_technical_score = 7.0,
        min_behavioral_score = 7.0
      WHERE company_name = 'Flipkart';

      UPDATE company_profiles SET
        readiness_threshold = 65,
        hard_session_requirement = 1,
        min_technical_score = 6.0,
        min_behavioral_score = 6.5
      WHERE company_name = 'Startup';
    `;

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Database connection or query error:', err.message);
  } finally {
    await client.end();
  }
};

run();

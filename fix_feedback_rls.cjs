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
    await client.connect();
    
    // Check columns
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'feedback';
    `);
    console.log("Feedback columns:", res.rows.map(r => r.column_name).join(", "));
    
    // Add INSERT and UPDATE policies
    const sql = `
      DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
      CREATE POLICY "Users can insert own feedback" 
          ON public.feedback FOR INSERT 
          TO authenticated 
          WITH CHECK (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id));
          
      DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
      CREATE POLICY "Users can update own feedback" 
          ON public.feedback FOR UPDATE 
          TO authenticated 
          USING (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id))
          WITH CHECK (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id));
    `;
    
    await client.query(sql);
    console.log('Policies applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
};

run();

const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://oymtdxfzsccgczlqluud.supabase.co', 'sb_publishable_FiWYCPSJayBZgs1pSHJlRw_vNFlrujd');

async function run() {
  const { data, error } = await sb.from('feedback').insert({ user_id: '123' });
  console.log("Error:", error);
}
run();

const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://oymtdxfzsccgczlqluud.supabase.co', 'sb_publishable_FiWYCPSJayBZgs1pSHJlRw_vNFlrujd');

async function run() {
  const { data: fb, error } = await sb.from('feedback').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log('Feedback row:', fb[0]);
  }
}
run();

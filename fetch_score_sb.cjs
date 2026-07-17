const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://oymtdxfzsccgczlqluud.supabase.co', 'sb_publishable_FiWYCPSJayBZgs1pSHJlRw_vNFlrujd');

async function run() {
  const { data: profs } = await sb.from('profiles').select('*').limit(5);
  console.log('Profiles:', profs);

  const { data: users } = await sb.from('users').select('*').limit(5);
  console.log('Users:', users);
}
run();

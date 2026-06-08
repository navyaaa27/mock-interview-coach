import { createClient } from '@supabase/supabase-js'

const projectUrl = 'https://oymtdxfzsccgczlqluud.supabase.co'
const anonKey = 'sb_publishable_FiWYCPSJayBZgs1pSHJlRw_vNFlrujd'

export const supabase = createClient(projectUrl, anonKey)

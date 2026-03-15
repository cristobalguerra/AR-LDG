import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ttbrilqxudiqbgjsdgbu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pz-cYVhcFpvoJ0zTkBU09Q_IcKZN6bC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

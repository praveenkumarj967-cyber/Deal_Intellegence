import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL || 'https://grdlsieksrtdbzhmfelr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGxzaWVrc3J0ZGJ6aG1mZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY4MTUzMywiZXhwIjoyMTA2MjU3NTMzfQ.4L8_hJWFJ6zHCRiK_eey1sLHBzpCRJ1wv9adMZc6xpg';

const supabase = createClient(url, key);

async function testTable() {
  console.log('Testing user_credentials table in Supabase...');
  const { data, error } = await supabase.from('user_credentials').select('*').limit(1);
  if (error) {
    console.log('user_credentials status:', error.message);
  } else {
    console.log('✅ user_credentials table exists! Rows:', data.length);
  }
}

testTable();

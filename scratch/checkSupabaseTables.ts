import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const url = process.env.SUPABASE_URL || 'https://grdlsieksrtdbzhmfelr.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGxzaWVrc3J0ZGJ6aG1mZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY4MTUzMywiZXhwIjoyMTA2MjU3NTMzfQ.4L8_hJWFJ6zHCRiK_eey1sLHBzpCRJ1wv9adMZc6xpg';

const supabase = createClient(url, serviceKey);

async function checkTables() {
  console.log('Connecting to Supabase at:', url);
  const tables = ['profiles', 'deals', 'customers', 'stakeholders', 'interactions', 'deal_memories', 'competitors', 'recommendations', 'scheduled_meetings'];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    if (error) {
      console.log(`❌ Table '${t}': NOT PRESENT or error:`, error.message);
    } else {
      console.log(`✅ Table '${t}': EXISTS (rows: ${data ? data.length : 0})`);
    }
  }
}

checkTables();

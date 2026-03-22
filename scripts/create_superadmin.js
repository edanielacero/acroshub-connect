// Script to register the superadmin user.
// 1. Run this script using `node scripts/create_superadmin.js` (you may need to install dotenv and @supabase/supabase-js if running standalone).
// 2. Since this uses the Anon Key, it will create the user in the 'auth.users' table with the default role of 'alumno' (via the trigger).
// 3. Afterward, you must run the SQL snippet in the Supabase Dashboard SQL Editor to upgrade the role to 'super_admin'.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSuperAdmin() {
  console.log("Creating superadmin user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'e.daniel.acero.r@gmail.com',
    password: 'admindaniel',
    options: {
      data: {
        full_name: 'Daniel Acero',
        role: 'super_admin'
      }
    }
  });

  if (error) {
    console.error("Error creating user:", error.message);
    return;
  }

  console.log("User created successfully!");
  console.log("User ID:", data.user?.id);
  console.log("\nIMPORTANT: Please run the following SQL command in your Supabase SQL Editor to ensure the user has the correct role in the 'profiles' table:");
  console.log(`\nUPDATE public.profiles SET role = 'super_admin' WHERE id = '${data.user?.id}';\n`);
}

createSuperAdmin();

// scripts/create_master_admin.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin() {
  const adminEmail = 'admin@africarailways.com';
  
  // 1. Create the user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: 'TemporaryDefaultPassword2026!', // They will be prompted to change this
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) console.error("Error creating admin:", error.message);
  else {
    console.log("✅ Admin created. Sending invitation email...");
    
    // 2. Send the invitation/password email
    await supabase.auth.admin.generateLink({
      type: 'invite',
      email: adminEmail,
    });
  }
}

setupAdmin();

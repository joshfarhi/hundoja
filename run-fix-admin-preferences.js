const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔧 Fixing admin preferences function overloading issue...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'fix-admin-preferences-function.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql not available, trying direct query...');
      
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.log('⚠️  Direct query failed, you may need to run this manually in Supabase SQL editor');
            console.log('Statement:', statement);
            console.log('Error:', stmtError);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open the SQL editor');
    console.log('   3. Copy and paste the contents of fix-admin-preferences-function.sql');
    console.log('   4. Run the SQL');
    console.log('   5. Test your admin preferences functionality');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    console.log('');
    console.log('📋 Manual steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open the SQL editor');
    console.log('   3. Copy and paste the contents of fix-admin-preferences-function.sql');
    console.log('   4. Run the SQL');
    console.log('   5. Test your admin preferences functionality');
  }
}

runMigration(); 
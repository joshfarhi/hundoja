const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local if it exists
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
    return acc;
  }, {});

  process.env = { ...process.env, ...envVars };
} catch (error) {
  console.log('No .env.local file found, using system environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting newsletter migration...');

    // Read the SQL file
    const sql = fs.readFileSync('migrate-newsletter-to-shared-admin-access.sql', 'utf8');

    // Split SQL into individual statements (by semicolon, but be careful with comments)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use raw SQL execution
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`📊 Results: ${successCount} successful, ${errorCount} errors`);

    // Verify the migration worked
    console.log('\n🔍 Verifying newsletter data access...');

    const { data: subscribers, error: verifyError } = await supabase
      .from('newsletter_subscribers')
      .select('count', { count: 'exact', head: true });

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log(`✅ Newsletter table accessible. Total subscribers: ${subscribers}`);
    }

    const { data: analytics } = await supabase
      .from('newsletter_analytics')
      .select('*')
      .single();

    if (analytics) {
      console.log('✅ Newsletter analytics accessible:', analytics);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

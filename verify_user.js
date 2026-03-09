
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
    console.log(`Checking user: ${email}`);

    // Check in users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (userError) {
        console.error('Error fetching user from public.users:', userError);
    } else {
        console.log('Public user profile found:', userData ? 'YES' : 'NO');
        if (userData) console.log('User Role/Metadata:', userData);
    }

    // Check in auth system (requires service role key)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError);
    } else {
        const foundUser = authData.users.find(u => u.email === email);
        console.log('Auth user found:', foundUser ? 'YES' : 'NO');
        if (foundUser) {
            console.log('Auth User ID:', foundUser.id);
            console.log('Email Confirmed:', foundUser.email_confirmed_at ? 'YES' : 'NO');
            console.log('Last Sign In:', foundUser.last_sign_in_at || 'NEVER');
            console.log('User Metadata:', foundUser.user_metadata);

            // If the user is invited, they might not have a password yet
            if (foundUser.invited_at && !foundUser.last_sign_in_at) {
                console.log('WARNING: This user was invited but has never signed in. They likely haven\'t set a password!');
            }
        }
    }
}

async function listLastUsers() {
    console.log('Listing last 5 users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError);
    } else {
        const sortedUsers = authData.users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const last5 = sortedUsers.slice(0, 5);
        last5.forEach(u => {
            console.log(`- Email: ${u.email}, ID: ${u.id}, Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}, Last Sign In: ${u.last_sign_in_at || 'NEVER'}`);
            if (u.invited_at && !u.last_sign_in_at) {
                console.log(`  WARNING: This user was invited (${u.invited_at}) but never signed in.`);
            }
        });
    }
}

// Get email from command line
const emailToCheck = process.argv[2];
if (!emailToCheck) {
    listLastUsers();
} else {
    checkUser(emailToCheck);
}

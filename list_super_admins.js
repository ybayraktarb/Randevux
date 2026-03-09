
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSuperAdmins() {
    console.log('Listing Super Admins...');
    const { data, error } = await supabase.from('super_admins').select('user_id');
    if (error) {
        console.error('Error fetching super admins:', error);
        return;
    }

    const userIds = data.map(d => d.user_id);
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError);
    } else {
        const superAdmins = authData.users.filter(u => userIds.includes(u.id));
        superAdmins.forEach(u => {
            console.log(`- Email: ${u.email}, ID: ${u.id}, Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}, Last Sign In: ${u.last_sign_in_at || 'NEVER'}`);
        });
    }
}

listSuperAdmins();

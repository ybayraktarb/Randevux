
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listStaff() {
    console.log('Listing Staff...');
    const { data, error } = await supabase.from('staff_business').select('user_id, is_active');
    if (error) {
        console.error('Error fetching staff:', error);
        return;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError);
    } else {
        const staffIds = data.map(d => d.user_id);
        const staffUsers = authData.users.filter(u => staffIds.includes(u.id));
        staffUsers.forEach(u => {
            const dbStaff = data.find(d => d.user_id === u.id);
            console.log(`- Email: ${u.email}, ID: ${u.id}, Active(DB): ${dbStaff.is_active}, Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}, Last Sign In: ${u.last_sign_in_at || 'NEVER'}`);
        });
    }
}

listStaff();

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
    console.log("Checking users table columns...");
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .limit(1);

    if (error) {
        console.error("Error fetching from users table:", error);
    } else if (data && data.length > 0) {
        console.log("Columns in users table:", Object.keys(data[0]));
    } else {
        console.log("Users table is empty, creating a dummy query...");
        const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'users' });
        if (colError) {
            console.error("Error fetching columns via RPC (if exists):", colError);
        } else {
            console.log("Columns:", cols);
        }
    }
}

checkUsersTable();

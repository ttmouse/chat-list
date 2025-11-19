const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://noslltzmrhffjfatqlgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2xsdHptcmhmZmpmYXRxbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTIzMzcsImV4cCI6MjA3ODk2ODMzN30.sCI0LgBH4niNSQQdQoT_Bz218lml-Djux_M4GZR-yII';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importData() {
    try {
        const jsonPath = path.join(__dirname, '../chat-scripts-2025-11-15.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);

        console.log(`Read ${data.groups.length} groups and ${data.scripts.length} scripts from backup.`);

        // Import Groups
        if (data.groups && data.groups.length > 0) {
            const { error: groupError } = await client
                .from('chat_groups_public')
                .upsert(data.groups, { onConflict: 'id' });

            if (groupError) {
                console.error('Error importing groups:', groupError);
            } else {
                console.log('Groups imported successfully.');
            }
        }

        // Import Scripts
        if (data.scripts && data.scripts.length > 0) {
            const scriptsPayload = data.scripts.map(s => ({
                id: s.id,
                group_id: s.groupId || s.group_id,
                title: s.title,
                note: s.note,
                content: s.content,
                order_index: s.order_index || 0,
                is_active: true
            }));

            const { error: scriptError } = await client
                .from('public_catalog')
                .upsert(scriptsPayload, { onConflict: 'id' });

            if (scriptError) {
                console.error('Error importing scripts:', scriptError);
            } else {
                console.log('Scripts imported successfully.');
            }
        }

    } catch (err) {
        console.error('Import failed:', err);
    }
}

importData();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// CORS 配置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Supabase 配置
const supabase = createClient(
    'https://noslltzmrhffjfatqlgh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2xsdHptcmhmZmpmYXRxbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTIzMzcsImV4cCI6MjA3ODk2ODMzN30.sCI0LgBH4niNSQQdQoT_Bz218lml-Djux_M4GZR-yII'
);

// 批量上传接口
app.post('/api/upload-public', async (req, res) => {
    try {
        const { scripts, groups } = req.body;

        if (!scripts || !Array.isArray(scripts)) {
            return res.status(400).json({ error: '数据格式错误' });
        }

        const results = { scripts: [], groups: [] };

        // 上传分组
        if (groups && groups.length > 0) {
            const { data, error } = await supabase
                .from('chat_groups_public')
                .upsert(groups, { onConflict: 'id' });

            if (error) {
                console.error('分组上传失败:', error);
                results.groups.push({ success: false, error: error.message });
            } else {
                results.groups.push({ success: true, count: groups.length });
            }
        }

        // 上传话术
        if (scripts.length > 0) {
            const { data, error } = await supabase
                .from('public_catalog')
                .upsert(scripts, { onConflict: 'id' });

            if (error) {
                console.error('话术上传失败:', error);
                results.scripts.push({ success: false, error: error.message });
            } else {
                results.scripts.push({ success: true, count: scripts.length });
            }
        }

        res.json({
            success: true,
            message: '上传成功',
            results
        });

    } catch (error) {
        console.error('批量保存失败:', error);
        res.status(500).json({ error: '服务器错误: ' + error.message });
    }
});

// 测试接口
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '服务器运行正常' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
    console.log(`测试地址: http://localhost:${PORT}/api/test`);
});

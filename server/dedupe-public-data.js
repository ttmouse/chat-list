const { createClient } = require('@supabase/supabase-js');
const {
  buildGroupKey,
  buildScriptKey,
  normalizeGroupRecord,
  normalizeScriptRecord,
  mergeGroupRecords,
  mergeTags
} = require('./dedupe-helpers');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://noslltzmrhffjfatqlgh.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2xsdHptcmhmZmpmYXRxbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTIzMzcsImV4cCI6MjA3ODk2ODMzN30.sCI0LgBH4niNSQQdQoT_Bz218lml-Djux_M4GZR-yII';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Supabase 配置缺失，请设置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY 环境变量。');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const args = process.argv.slice(2);
const APPLY_CHANGES = args.includes('--apply');
const JSON_OUTPUT = args.includes('--json');
const SILENT = args.includes('--silent');
const CHUNK_SIZE = 200;

const log = (...messages) => {
  if (!SILENT) {
    console.log(...messages);
  }
};

const chunk = (arr, size = CHUNK_SIZE) => {
  const list = [];
  for (let i = 0; i < arr.length; i += size) {
    list.push(arr.slice(i, i + size));
  }
  return list;
};

const fetchCurrentState = async () => {
  const [groupRes, scriptRes] = await Promise.all([
    client.from('chat_groups_public').select('id,name,color,order_index,created_at'),
    client.from('public_catalog').select('id,group_id,title,note,content,order_index,is_active,usage_count,tags,lang,created_at')
  ]);

  if (groupRes.error) {
    throw new Error(`读取公共分组失败：${groupRes.error.message}`);
  }
  if (scriptRes.error) {
    throw new Error(`读取公共话术失败：${scriptRes.error.message}`);
  }

  return {
    groups: Array.isArray(groupRes.data) ? groupRes.data : [],
    scripts: Array.isArray(scriptRes.data) ? scriptRes.data : []
  };
};

const prepareGroupPlan = (groups = []) => {
  const sorted = [...groups].sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });

  const keyed = new Map();
  const deleteIds = [];
  const groupIdRemap = new Map();
  const updates = [];

  sorted.forEach((group) => {
    if (!group?.id) return;
    const normalized = normalizeGroupRecord(group);
    if (!normalized) return;
    const key = buildGroupKey(normalized);
    if (!key) return;

    if (!keyed.has(key)) {
      keyed.set(key, { canonical: group, normalized, duplicates: [] });
      groupIdRemap.set(group.id, group.id);
      return;
    }

    const entry = keyed.get(key);
    entry.duplicates.push({ record: group, normalized });
    entry.normalized = mergeGroupRecords(entry.normalized, normalized);
    deleteIds.push(group.id);
    groupIdRemap.set(group.id, entry.canonical.id);
  });

  keyed.forEach((entry) => {
    if (entry.duplicates.length > 0) {
      updates.push({
        id: entry.canonical.id,
        name: entry.normalized.name,
        color: entry.normalized.color,
        order_index: entry.normalized.order_index
      });
    }
  });

  return {
    canonicalCount: keyed.size,
    duplicateCount: deleteIds.length,
    deleteIds,
    groupIdRemap,
    updates
  };
};

const aggregateScriptRecords = (base, incoming) => ({
  ...base,
  title: base.title || incoming.title,
  note: base.note || incoming.note,
  content: base.content || incoming.content,
  order_index: Math.min(base.order_index ?? 0, incoming.order_index ?? 0),
  version: Math.max(base.version ?? 1, incoming.version ?? 1),
  tags: mergeTags(base.tags, incoming.tags),
  lang: base.lang || incoming.lang,
  is_active: base.is_active !== false && incoming.is_active !== false,
  usage_count: (base.usage_count ?? 0) + (incoming.usage_count ?? 0)
});

const prepareScriptPlan = (scripts = [], groupIdRemap = new Map()) => {
  const sorted = [...scripts].sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });

  const keyed = new Map();
  const deleteIds = [];
  const updates = [];

  sorted.forEach((script) => {
    if (!script?.id) return;
    const normalized = normalizeScriptRecord(script, groupIdRemap);
    if (!normalized) return;
    const key = buildScriptKey(normalized);
    if (!key) return;

    if (!keyed.has(key)) {
      keyed.set(key, { canonical: script, normalized, duplicates: [] });
      return;
    }

    const entry = keyed.get(key);
    entry.duplicates.push({ record: script, normalized });
    entry.normalized = aggregateScriptRecords(entry.normalized, normalized);
    deleteIds.push(script.id);
  });

  keyed.forEach((entry) => {
    if (entry.duplicates.length > 0) {
      updates.push({
        ...entry.normalized,
        id: entry.canonical.id
      });
    }
  });

  return {
    canonicalFamilies: updates.length,
    duplicateCount: deleteIds.length,
    deleteIds,
    updates
  };
};

const buildGroupReassignments = (scripts = [], groupIdRemap = new Map(), excludedIds = new Set()) => {
  const patches = [];
  scripts.forEach((script) => {
    if (!script?.id) return;
    if (excludedIds.has(script.id)) return;
    const rawGroupId = script.group_id || null;
    const canonicalGroupId = rawGroupId ? groupIdRemap.get(rawGroupId) : null;
    if (canonicalGroupId && canonicalGroupId !== rawGroupId) {
      patches.push({ id: script.id, group_id: canonicalGroupId });
    }
  });
  return patches;
};

const batchUpsert = async (table, rows = []) => {
  for (const portion of chunk(rows)) {
    if (!portion.length) continue;
    const { error } = await client.from(table).upsert(portion, { onConflict: 'id' });
    if (error) {
      throw new Error(`Upsert ${table} 失败: ${error.message}`);
    }
  }
};

const batchDelete = async (table, ids = []) => {
  for (const portion of chunk(ids)) {
    if (!portion.length) continue;
    const { error } = await client.from(table).delete().in('id', portion);
    if (error) {
      throw new Error(`删除 ${table} 数据失败: ${error.message}`);
    }
  }
};

const main = async () => {
  const { groups, scripts } = await fetchCurrentState();
  const groupPlan = prepareGroupPlan(groups);
  const scriptPlan = prepareScriptPlan(scripts, groupPlan.groupIdRemap);
  const deleteScriptSet = new Set(scriptPlan.deleteIds);
  const groupReassignments = buildGroupReassignments(scripts, groupPlan.groupIdRemap, deleteScriptSet);

  const summary = {
    groups: {
      total: groups.length,
      duplicates: groupPlan.duplicateCount,
      deleteTargets: groupPlan.deleteIds.length,
      updates: groupPlan.updates.length
    },
    scripts: {
      total: scripts.length,
      duplicateFamilies: scriptPlan.canonicalFamilies,
      deleteTargets: scriptPlan.deleteIds.length,
      mergedFamilies: scriptPlan.updates.length
    },
    reassignments: groupReassignments.length
  };

  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        {
          summary,
          plan: {
            groupPlan,
            scriptPlan,
            groupReassignments
          }
        },
        null,
        2
      )
    );
  } else {
    log('== 去重计划 ==');
    log(
      `分组：${summary.groups.total} 条，重复 ${summary.groups.duplicates} 条，将更新 ${summary.groups.updates} 条，删除 ${summary.groups.deleteTargets} 条`
    );
    log(
      `话术：${summary.scripts.total} 条，重复族 ${summary.scripts.duplicateFamilies} 组，将更新 ${summary.scripts.mergedFamilies} 组，删除 ${summary.scripts.deleteTargets} 条`
    );
    if (summary.reassignments > 0) {
      log(`额外：${summary.reassignments} 条话术需要切换到保留下来的分组`);
    }
    if (!APPLY_CHANGES) {
      log('（干跑模式）添加 --apply 参数即可写入数据库。');
    }
  }

  if (!APPLY_CHANGES) {
    return;
  }

  if (groupPlan.updates.length) {
    log(`更新 ${groupPlan.updates.length} 个保留分组...`);
    await batchUpsert('chat_groups_public', groupPlan.updates);
  }

  if (groupReassignments.length) {
    log(`调整 ${groupReassignments.length} 条话术所属分组...`);
    await batchUpsert('public_catalog', groupReassignments);
  }

  if (scriptPlan.updates.length) {
    log(`合并 ${scriptPlan.updates.length} 组重复话术的内容...`);
    await batchUpsert('public_catalog', scriptPlan.updates);
  }

  if (scriptPlan.deleteIds.length) {
    log(`删除 ${scriptPlan.deleteIds.length} 条重复话术...`);
    await batchDelete('public_catalog', scriptPlan.deleteIds);
  }

  if (groupPlan.deleteIds.length) {
    log(`删除 ${groupPlan.deleteIds.length} 个重复分组...`);
    await batchDelete('chat_groups_public', groupPlan.deleteIds);
  }

  log('去重完成。');
};

main().catch((error) => {
  console.error('去重失败:', error.message || error);
  process.exit(1);
});

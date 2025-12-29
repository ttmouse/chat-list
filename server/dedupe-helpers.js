const crypto = require('crypto');

const KEY_DELIMITER = '::';

const normalizeOrderIndex = (value) => {
  if (Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizeString = (value) => {
  if (!value && value !== 0) return '';
  return String(value).trim();
};

const normalizeKeyString = (value) => normalizeString(value).toLowerCase();

const normalizeContentKey = (value) => normalizeString((value || '').replace(/\r\n/g, '\n')).toLowerCase();

const normalizeTags = (value) => {
  if (!value && value !== 0) return [];
  const dedupe = (list) => Array.from(new Set(list.filter(Boolean)));
  if (Array.isArray(value)) {
    return dedupe(value.map((item) => normalizeString(item)));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return dedupe(parsed.map((item) => normalizeString(item)));
      }
    } catch (_) {
      // fall back to comma split
    }
    return dedupe(trimmed.split(',').map((part) => normalizeString(part)));
  }
  return [];
};

const mergeTags = (a, b) => Array.from(new Set([...(a || []), ...(b || [])].filter(Boolean)));

const normalizeGroupRecord = (group) => {
  if (!group) return null;
  const normalized = {
    id: group.id || null,
    name: normalizeString(group.name || ''),
    color: group.color || null,
    order_index: normalizeOrderIndex(group.order_index ?? group.orderIndex)
  };
  return normalized.name || normalized.id ? normalized : null;
};

const mergeGroupRecords = (base, incoming) => ({
  ...base,
  name: incoming.name || base.name,
  color: incoming.color || base.color,
  order_index: Math.min(base.order_index ?? 0, incoming.order_index ?? 0)
});

const normalizeScriptRecord = (script, groupIdRemap = new Map()) => {
  if (!script) return null;
  const rawGroupId = script.groupId ?? script.group_id ?? null;
  const canonicalGroupId = groupIdRemap.get(rawGroupId) ?? rawGroupId ?? null;
  const normalized = {
    id: script.id || null,
    group_id: canonicalGroupId,
    title: normalizeString(script.title || ''),
    note: normalizeString(script.note || ''),
    content: typeof script.content === 'string' ? script.content : (script.content ?? ''),
    order_index: normalizeOrderIndex(script.order_index ?? script.orderIndex),
    version: Number.isFinite(script.version) ? script.version : 1,
    tags: normalizeTags(script.tags),
    lang: script.lang || 'zh',
    is_active: script.is_active !== false,
    usage_count: Number.isFinite(script.usage_count) ? script.usage_count : 0
  };
  return normalized.title || normalized.content ? normalized : null;
};

const mergeScriptRecords = (base, incoming) => ({
  ...base,
  title: incoming.title || base.title,
  note: incoming.note || base.note,
  content: incoming.content || base.content,
  order_index: Math.min(base.order_index ?? 0, incoming.order_index ?? 0),
  version: Math.max(base.version ?? 1, incoming.version ?? 1),
  tags: mergeTags(base.tags, incoming.tags),
  lang: incoming.lang || base.lang,
  is_active: base.is_active !== false && incoming.is_active !== false,
  usage_count: Math.max(base.usage_count ?? 0, incoming.usage_count ?? 0)
});

const buildGroupKey = (group) => {
  if (!group) return '';
  const name = normalizeKeyString(group.name || '');
  if (!name) return '';
  return `${name}`;
};

const buildScriptKey = (script) => {
  if (!script) return '';
  const titleKey = normalizeKeyString(script.title || '');
  const contentKey = normalizeContentKey(script.content || '');
  if (!titleKey && !contentKey) return '';
  const groupPart = script.group_id ? String(script.group_id) : '';
  return [titleKey, contentKey, groupPart].join(KEY_DELIMITER);
};

const generateDeterministicId = (key) => crypto.createHash('sha1').update(key).digest('hex').slice(0, 16);

const dedupeGroupsForUpload = (incomingGroups = [], existingGroups = []) => {
  const existingMap = new Map();
  const dedupedMap = new Map();
  const groupIdRemap = new Map();

  (existingGroups || []).forEach((group) => {
    const normalized = normalizeGroupRecord(group);
    if (!normalized) return;
    const key = buildGroupKey(normalized);
    if (!key || !normalized.id) return;
    existingMap.set(key, normalized.id);
    groupIdRemap.set(normalized.id, normalized.id);
  });

  (incomingGroups || []).forEach((group) => {
    const normalized = normalizeGroupRecord(group);
    if (!normalized) return;
    const key = buildGroupKey(normalized);
    if (!key) return;
    const canonicalId = existingMap.get(key) || normalized.id || generateDeterministicId(key);
    const next = {
      ...normalized,
      id: canonicalId
    };
    existingMap.set(key, canonicalId);
    groupIdRemap.set(group.id || canonicalId, canonicalId);
    groupIdRemap.set(canonicalId, canonicalId);

    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, next);
    } else {
      dedupedMap.set(key, mergeGroupRecords(dedupedMap.get(key), next));
    }
  });

  return {
    groups: Array.from(dedupedMap.values()),
    groupIdRemap
  };
};

const dedupeScriptsForUpload = (incomingScripts = [], existingScripts = [], groupIdRemap = new Map()) => {
  const existingMap = new Map();
  const dedupedMap = new Map();

  (existingScripts || []).forEach((script) => {
    const normalized = normalizeScriptRecord(script);
    if (!normalized) return;
    const key = buildScriptKey(normalized);
    if (!key || !normalized.id) return;
    existingMap.set(key, normalized.id);
  });

  (incomingScripts || []).forEach((script) => {
    const normalized = normalizeScriptRecord(script, groupIdRemap);
    if (!normalized) return;
    const key = buildScriptKey(normalized);
    if (!key) return;
    const canonicalId = existingMap.get(key) || normalized.id || generateDeterministicId(key);
    const next = {
      ...normalized,
      id: canonicalId
    };
    existingMap.set(key, canonicalId);

    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, next);
    } else {
      dedupedMap.set(key, mergeScriptRecords(dedupedMap.get(key), next));
    }
  });

  return {
    scripts: Array.from(dedupedMap.values())
  };
};

const fetchExistingPublicData = async (client) => {
  const [groupRes, scriptRes] = await Promise.all([
    client.from('chat_groups_public').select('id,name,color,order_index'),
    client.from('public_catalog').select('id,group_id,title,note,content,order_index,is_active,usage_count,tags,lang')
  ]);

  if (groupRes.error) {
    throw new Error(`加载公共分组失败: ${groupRes.error.message}`);
  }
  if (scriptRes.error) {
    throw new Error(`加载公共话术失败: ${scriptRes.error.message}`);
  }

  return {
    groups: Array.isArray(groupRes.data) ? groupRes.data : [],
    scripts: Array.isArray(scriptRes.data) ? scriptRes.data : []
  };
};

const preparePublicUploadPayload = async (client, payload = {}) => {
  const { groups = [], scripts = [] } = payload;
  if ((!groups || !groups.length) && (!scripts || !scripts.length)) {
    return { groups: [], scripts: [], summary: { incomingGroups: 0, outgoingGroups: 0, incomingScripts: 0, outgoingScripts: 0 } };
  }

  const existing = await fetchExistingPublicData(client);
  const { groups: dedupedGroups, groupIdRemap } = dedupeGroupsForUpload(groups, existing.groups);
  const { scripts: dedupedScripts } = dedupeScriptsForUpload(scripts, existing.scripts, groupIdRemap);

  return {
    groups: dedupedGroups,
    scripts: dedupedScripts,
    summary: {
      incomingGroups: groups.length,
      outgoingGroups: dedupedGroups.length,
      incomingScripts: scripts.length,
      outgoingScripts: dedupedScripts.length
    }
  };
};

module.exports = {
  buildGroupKey,
  buildScriptKey,
  dedupeGroupsForUpload,
  dedupeScriptsForUpload,
  preparePublicUploadPayload,
  normalizeGroupRecord,
  normalizeScriptRecord,
  normalizeTags,
  mergeTags,
  normalizeOrderIndex,
  mergeGroupRecords,
  mergeScriptRecords
};

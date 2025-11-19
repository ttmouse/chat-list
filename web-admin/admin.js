import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const urlEl = document.getElementById('inp-url')
const keyEl = document.getElementById('inp-key')
const tokenEl = document.getElementById('inp-token')
const saveBtn = document.getElementById('btn-save')
const loadPublicBtn = document.getElementById('btn-load-public')
const loadReqBtn = document.getElementById('btn-load-requests')
const importPublicBtn = document.getElementById('btn-import-public')
const exportPublicBtn = document.getElementById('btn-export-public')
const tblPublic = document.querySelector('#tbl-public tbody')
const tblReq = document.querySelector('#tbl-requests tbody')
const formGroup = document.getElementById('form-group')
const formTitle = document.getElementById('form-title')
const formNote = document.getElementById('form-note')
const formContent = document.getElementById('form-content')
const formOrder = document.getElementById('form-order')
const formActive = document.getElementById('form-active')
const btnPubSave = document.getElementById('btn-pub-save')
const btnPubReset = document.getElementById('btn-pub-reset')

let client = null
let groups = []
let editingId = null

function lsGet(k) { try { return localStorage.getItem(k) || '' } catch { return '' } }
function lsSet(k, v) { try { localStorage.setItem(k, v) } catch { } }

async function loadConfig() {
  const cfg = window.WEBADMIN_CONFIG || {}
  const url = cfg.SUPABASE_URL || lsGet('SUPABASE_URL')
  const key = cfg.SUPABASE_ANON_KEY || lsGet('SUPABASE_ANON_KEY')
  const token = cfg.publishToken || lsGet('publishToken')
  urlEl.value = url || ''
  keyEl.value = key || ''
  tokenEl.value = token || ''
  if (url && key) { client = createClient(url, key); const row = document.getElementById('row-config'); if (row) row.style.display = 'none' }
}

async function saveConfig() {
  const url = urlEl.value.trim()
  const key = keyEl.value.trim()
  const token = tokenEl.value.trim()
  lsSet('SUPABASE_URL', url)
  lsSet('SUPABASE_ANON_KEY', key)
  lsSet('publishToken', token)
  if (url && key) { client = createClient(url, key) }
}

async function loadPublic() {
  if (!client) return
  const gr = await client.from('chat_groups_public').select('*').order('order_index', { ascending: true })
  groups = gr.data || []
  formGroup.innerHTML = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')
  const sr = await client.from('public_catalog').select('*').order('order_index', { ascending: true })
  tblPublic.innerHTML = (sr.data || []).map(s => {
    const g = groups.find(x => x.id === s.group_id)
    return `<tr><td>${g ? g.name : ''}</td><td>${s.title}</td><td>${s.note || ''}</td><td class="actions"><button data-id="${s.id}" class="btn-outline btn-edit">编辑</button><button data-id="${s.id}" class="btn-outline btn-del">删除</button></td></tr>`
  }).join('')
}

async function loadRequests() {
  if (!client) return
  const r = await client.from('publish_requests').select('*').order('updated_at', { ascending: false })
  tblReq.innerHTML = (r.data || []).map(x => {
    const p = x.payload || {}
    return `<tr><td><span class="badge">${x.status}</span></td><td>${p.title || ''}</td><td>${(p.content || '').slice(0, 160)}</td><td class="actions"><button class="btn" data-id="${x.id}" data-action="approve">通过</button><button class="btn-outline" data-id="${x.id}" data-action="reject">拒绝</button></td></tr>`
  }).join('')
}

async function approveRequest(id) {
  const token = lsGet('publishToken')
  const r = await client.from('publish_requests').select('*').eq('id', id).limit(1)
  const row = (r.data || [])[0]
  if (!row) return
  const p = row.payload || {}
  const pub = { id: p.id, group_id: p.group_id, title: p.title, note: p.note || '', content: p.content, order_index: p.order_index || 0, is_active: true }
  await client.from('public_catalog').upsert(pub, { onConflict: 'id' })
  await client.from('publish_requests').update({ status: 'approved', token }).eq('id', id)
  await loadPublic()
  await loadRequests()
}

async function rejectRequest(id) {
  const token = lsGet('publishToken')
  await client.from('publish_requests').update({ status: 'rejected', token }).eq('id', id)
  await loadRequests()
}

tblPublic.addEventListener('click', async e => {
  const del = e.target.closest('.btn-del')
  const edit = e.target.closest('.btn-edit')
  if (del) {
    const id = del.getAttribute('data-id')
    await client.from('public_catalog').delete().eq('id', id)
    await loadPublic()
  } else if (edit) {
    const id = edit.getAttribute('data-id')
    const r = await client.from('public_catalog').select('*').eq('id', id).limit(1)
    const s = (r.data || [])[0]
    if (!s) return
    editingId = s.id
    formGroup.value = s.group_id
    formTitle.value = s.title || ''
    formNote.value = s.note || ''
    formContent.value = s.content || ''
    formOrder.value = s.order_index || 0
    formActive.checked = !!s.is_active
  }
})

tblReq.addEventListener('click', async e => {
  const btn = e.target.closest('button')
  if (!btn) return
  const id = btn.getAttribute('data-id')
  const act = btn.getAttribute('data-action')
  if (act === 'approve') await approveRequest(id)
  if (act === 'reject') await rejectRequest(id)
})

btnPubSave.addEventListener('click', async () => {
  if (!client) return
  const id = editingId || (`${Date.now()}${Math.random().toString(36).slice(2, 8)}`)
  const row = {
    id,
    group_id: formGroup.value || null,
    title: formTitle.value.trim(),
    note: formNote.value.trim(),
    content: formContent.value.trim(),
    order_index: Number(formOrder.value || 0),
    is_active: !!formActive.checked
  }
  await client.from('public_catalog').upsert(row, { onConflict: 'id' })
  editingId = null
  await loadPublic()
})

btnPubReset.addEventListener('click', () => {
  editingId = null
  formTitle.value = ''
  formNote.value = ''
  formContent.value = ''
  formOrder.value = '0'
  if (groups[0]) formGroup.value = groups[0].id
  formActive.checked = true
})

saveBtn.addEventListener('click', saveConfig)
loadPublicBtn.addEventListener('click', loadPublic)
loadReqBtn.addEventListener('click', loadRequests)
importPublicBtn.addEventListener('click', importPublicJson)
exportPublicBtn.addEventListener('click', exportPublicJson)

// 页面加载时自动初始化
async function init() {
  await loadConfig();

  // 如果客户端已初始化，自动加载数据
  if (client) {
    console.log('自动加载公共库和发布请求...');
    await Promise.all([
      loadPublic(),
      loadRequests()
    ]);
    console.log('数据加载完成');
  } else {
    console.log('Supabase 客户端未初始化，请先配置');
  }
}

init();

async function importPublicJson() {
  if (!client) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.style.display = 'none'
  input.addEventListener('change', async e => {
    const f = e.target.files?.[0]
    if (!f) { document.body.removeChild(input); return }
    try {
      const text = await f.text()
      const data = JSON.parse(text)
      if (!data || !Array.isArray(data.scripts)) throw new Error('格式错误')
      const groupsData = Array.isArray(data.groups) ? data.groups : []
      if (groupsData.length) {
        await client.from('chat_groups_public').upsert(groupsData.map(g => ({ id: g.id, name: g.name, color: g.color, order_index: g.order_index || 0 })), { onConflict: 'id' })
      }
      const scriptsData = data.scripts.map(s => ({ id: s.id || `${Date.now()}${Math.random().toString(36).slice(2, 8)}`, group_id: s.groupId || s.group_id || null, title: s.title, note: s.note || '', content: s.content, order_index: s.order_index || 0, is_active: true }))
      if (scriptsData.length) {
        await client.from('public_catalog').upsert(scriptsData, { onConflict: 'id' })
      }
      await loadPublic()
      alert('导入成功')
    } catch (err) {
      console.error(err)
      alert('导入失败，请检查JSON格式')
    }
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

async function exportPublicJson() {
  if (!client) return
  const gr = await client.from('chat_groups_public').select('*').order('order_index', { ascending: true })
  const sr = await client.from('public_catalog').select('*').order('order_index', { ascending: true })
  const payload = { groups: gr.data || [], scripts: (sr.data || []).map(s => ({ id: s.id, groupId: s.group_id, title: s.title, note: s.note, content: s.content, order_index: s.order_index })) }
  const str = JSON.stringify(payload, null, 2)
  const blob = new Blob([str], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'public-catalog.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

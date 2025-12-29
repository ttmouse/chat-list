import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const urlEl = document.getElementById('inp-url')
const keyEl = document.getElementById('inp-key')
const tokenEl = document.getElementById('inp-token')
const saveBtn = document.getElementById('btn-save')
const loadPublicBtn = document.getElementById('btn-load-public')
const importPublicBtn = document.getElementById('btn-import-public')
const exportPublicBtn = document.getElementById('btn-export-public')
const scriptList = document.getElementById('script-list')
const searchInput = document.getElementById('script-search')
const groupFilterEl = document.getElementById('group-filter')

// Form Elements
const formGroup = document.getElementById('form-group')
const formTitle = document.getElementById('form-title')
const formNote = document.getElementById('form-note')
const formContent = document.getElementById('form-content')
const formOrder = document.getElementById('form-order')
const formActive = document.getElementById('form-active')
const btnPubSave = document.getElementById('btn-pub-save')
const btnSidebarSave = document.getElementById('btn-sidebar-save')
const btnPubDel = document.getElementById('btn-pub-del')
const btnAddNew = document.getElementById('btn-add-new')
const editorTitle = document.getElementById('editor-title')

const GROUP_ALL = 'all'
const GROUP_UNGROUPED = 'ungrouped'

let client = null
let groups = []
let scripts = []
let editingId = null
let selectedGroupId = GROUP_ALL
let searchQuery = ''

function lsGet(k) { try { return localStorage.getItem(k) || '' } catch { return '' } }
function lsSet(k, v) { try { localStorage.setItem(k, v) } catch { } }

// Load Config
async function loadConfig() {
  const cfg = window.WEBADMIN_CONFIG || {}
  const url = cfg.SUPABASE_URL || lsGet('SUPABASE_URL')
  const key = cfg.SUPABASE_ANON_KEY || lsGet('SUPABASE_ANON_KEY')
  const token = cfg.publishToken || lsGet('publishToken')

  if (urlEl) urlEl.value = url || ''
  if (keyEl) keyEl.value = key || ''
  if (tokenEl) tokenEl.value = token || ''

  if (url && key) {
    try {
      client = createClient(url, key)
      const row = document.getElementById('row-config')
      if (row) row.style.display = 'none'
    } catch (e) {
      console.error('Supabase init failed:', e)
    }
  }
}

async function saveConfig() {
  const url = urlEl.value.trim()
  const key = keyEl.value.trim()
  const token = tokenEl.value.trim()
  lsSet('SUPABASE_URL', url)
  lsSet('SUPABASE_ANON_KEY', key)
  lsSet('publishToken', token)
  if (url && key) {
    client = createClient(url, key)
    await loadPublic()
  }
}

// Load Data
async function loadPublic() {
  if (!client) return

  try {
    // Load Groups
    const gr = await client.from('chat_groups_public').select('*').order('order_index', { ascending: true })
    groups = gr.data || []

    // Update Group Select
    formGroup.innerHTML = '<option value="">选择分组</option>' + groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')

    // Load Scripts
    const sr = await client.from('public_catalog').select('*').order('order_index', { ascending: true })
    scripts = sr.data || []

    if (selectedGroupId !== GROUP_ALL && selectedGroupId !== GROUP_UNGROUPED) {
      const groupExists = groups.some(g => String(g.id) === selectedGroupId)
      if (!groupExists) selectedGroupId = GROUP_ALL
    }

    renderGroupFilter()

    renderList()

    // If editing, re-select the item to update view
    if (editingId) {
      const exists = scripts.find(s => s.id === editingId)
      if (!exists) {
        resetForm()
      } else {
        // Highlight current
        updateListSelection()
      }
    }
  } catch (e) {
    console.error('Load data failed:', e)
    alert('加载数据失败: ' + e.message)
  }
}

function renderGroupFilter() {
  if (!groupFilterEl) return

  const hasUngrouped = scripts.some(s => !s.group_id)
  const buttonConfigs = [
    { id: GROUP_ALL, label: '全部' },
    ...(hasUngrouped ? [{ id: GROUP_UNGROUPED, label: '未分组' }] : []),
    ...groups.map(g => ({
      id: String(g.id),
      label: g.name || '未命名分组'
    }))
  ]

  if (!buttonConfigs.length) {
    groupFilterEl.innerHTML = '<span class="text-xs text-slate-400">暂无分组</span>'
    return
  }

  groupFilterEl.innerHTML = buttonConfigs.map(cfg => {
    const isActive = selectedGroupId === cfg.id
    const base = 'px-3 py-1 rounded-full border text-xs whitespace-nowrap transition-all'
    const active = 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
    const inactive = 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
    return `<button type="button" data-id="${cfg.id}" class="${base} ${isActive ? active : inactive}">${cfg.label}</button>`
  }).join('')
}

function getFilteredScripts() {
  const query = searchQuery.trim().toLowerCase()
  return scripts.filter(s => {
    const groupId = s.group_id === null || s.group_id === undefined ? '' : String(s.group_id)
    let matchesGroup = true
    if (selectedGroupId === GROUP_UNGROUPED) {
      matchesGroup = !groupId
    } else if (selectedGroupId !== GROUP_ALL) {
      matchesGroup = groupId === selectedGroupId
    }

    if (!matchesGroup) return false
    if (!query) return true

    const text = `${s.title || ''} ${s.note || ''} ${s.content || ''}`.toLowerCase()
    return text.includes(query)
  })
}

function normalizeTagList(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) {
    return tags.map(tag => typeof tag === 'string' ? tag.trim() : tag).filter(Boolean)
  }
  if (typeof tags === 'string') {
    const trimmed = tags.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(tag => typeof tag === 'string' ? tag.trim() : tag).filter(Boolean)
      }
    } catch (_) {
      // fall back to comma / whitespace separated text
    }
    return trimmed.split(/[,，\s]+/).map(item => item.trim()).filter(Boolean)
  }
  return []
}

function getDimensionCount(script) {
  if (!script) return 0
  if (typeof script.dimension_count === 'number' && !Number.isNaN(script.dimension_count)) {
    return script.dimension_count
  }
  const normalizedTags = normalizeTagList(script.tags)
  return normalizedTags.length
}

function renderList() {
  const filtered = getFilteredScripts()
  const countEl = document.getElementById('public-count')
  if (countEl) countEl.textContent = filtered.length === scripts.length ? scripts.length : `${filtered.length}/${scripts.length}`

  if (!filtered.length) {
    const message = scripts.length ? '未找到匹配话术' : '暂无数据'
    scriptList.innerHTML = `<div class="text-center text-slate-400 py-8 text-sm">${message}</div>`
    return
  }

  scriptList.innerHTML = filtered.map(s => {
    const g = groups.find(x => x.id === s.group_id)
    const isActive = s.id === editingId ? 'active' : ''
    const note = s.note || s.content || ''

    return `
      <div class="script-item p-3 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 ${isActive}" data-id="${s.id}">
        <div class="flex justify-between items-start mb-1">
          <span class="font-medium text-slate-800 truncate flex-1 mr-2">${s.title}</span>
          ${g ? `<span class="flex-none px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600">${g.name}</span>` : ''}
      </div>
      <div class="text-xs text-slate-500 truncate">${note}</div>
      </div>`
  }).join('')

  updateListSelection()
}

function updateListSelection() {
  const items = scriptList.querySelectorAll('.script-item')
  items.forEach(item => {
    if (item.dataset.id === editingId) {
      item.classList.add('active')
      item.classList.add('bg-indigo-50')
      item.classList.add('border-indigo-200')
    } else {
      item.classList.remove('active')
      item.classList.remove('bg-indigo-50')
      item.classList.remove('border-indigo-200')
    }
  })
}

// Interactions
scriptList.addEventListener('click', e => {
  const item = e.target.closest('.script-item')
  if (!item) return

  const id = item.dataset.id
  selectScript(id)
})

if (searchInput) {
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value || ''
    renderList()
  })
}

if (groupFilterEl) {
  groupFilterEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-id]')
    if (!btn) return
    const newId = btn.dataset.id || GROUP_ALL
    if (selectedGroupId === newId) return
    selectedGroupId = newId
    renderGroupFilter()
    renderList()
  })
}

function selectScript(id) {
  const s = scripts.find(x => x.id === id)
  if (!s) return

  editingId = s.id
  formGroup.value = s.group_id || ''
  formTitle.value = s.title || ''
  formNote.value = s.note || ''
  formContent.value = s.content || ''
  formOrder.value = s.order_index || 0
  formActive.checked = !!s.is_active

  editorTitle.textContent = '编辑话术'
  btnPubDel.classList.remove('hidden')

  updateListSelection()
}

function resetForm() {
  editingId = null
  formGroup.value = ''
  formTitle.value = ''
  formNote.value = ''
  formContent.value = ''
  formOrder.value = '0'
  formActive.checked = true

  editorTitle.textContent = '新增话术'
  btnPubDel.classList.add('hidden')

  updateListSelection()

  // Focus title
  formTitle.focus()
}

btnAddNew.addEventListener('click', resetForm)

btnPubSave.addEventListener('click', async () => {
  if (!client) return

  const title = formTitle.value.trim()
  const content = formContent.value.trim()

  if (!title || !content) {
    alert('标题和内容不能为空')
    return
  }

  const id = editingId || (`${Date.now()}${Math.random().toString(36).slice(2, 8)}`)
  const row = {
    id,
    group_id: formGroup.value || null,
    title,
    note: formNote.value.trim(),
    content,
    order_index: Number(formOrder.value || 0),
    is_active: !!formActive.checked
  }

  try {
    const { error } = await client.from('public_catalog').upsert(row, { onConflict: 'id' })
    if (error) throw error

    // If it was new, set editingId so it stays selected
    editingId = id
    await loadPublic()

    // Show simple feedback
    const originalText = btnPubSave.innerHTML
    btnPubSave.innerHTML = '已保存'
    setTimeout(() => btnPubSave.innerHTML = originalText, 1000)

  } catch (e) {
    console.error('Save failed:', e)
    alert('保存失败: ' + e.message)
  }
})

btnPubDel.addEventListener('click', async () => {
  if (!editingId || !client) return

  if (!confirm('确定要删除这条话术吗？')) return

  try {
    const { error } = await client.from('public_catalog').delete().eq('id', editingId)
    if (error) throw error

    resetForm()
    await loadPublic()
  } catch (e) {
    console.error('Delete failed:', e)
    alert('删除失败: ' + e.message)
  }
})

// Config & Init
if (saveBtn) saveBtn.addEventListener('click', saveConfig)
if (loadPublicBtn) loadPublicBtn.addEventListener('click', loadPublic)
if (importPublicBtn) importPublicBtn.addEventListener('click', importPublicJson)
if (exportPublicBtn) exportPublicBtn.addEventListener('click', exportPublicJson)

async function init() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve))
  }
  await loadConfig()
  if (client) {
    await loadPublic()
  } else {
    const configRow = document.getElementById('row-config')
    if (configRow) configRow.style.display = 'block'
  }
}

init()

// Import/Export (Keep existing logic simplified)
async function importPublicJson() {
  if (!client) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const json = JSON.parse(e.target.result)
        const { groups, scripts } = json
        if (groups && groups.length) await client.from('chat_groups_public').upsert(groups, { onConflict: 'id' })
        if (scripts && scripts.length) {
          const payload = scripts.map(s => ({
            id: s.id,
            group_id: s.groupId || s.group_id,
            title: s.title,
            note: s.note,
            content: s.content,
            order_index: s.order_index || 0,
            is_active: true
          }))
          await client.from('public_catalog').upsert(payload, { onConflict: 'id' })
        }
        alert('导入成功')
        await loadPublic()
      } catch (err) {
        console.error(err)
        alert('导入失败，请检查JSON格式')
      }
    }
    reader.readAsText(file)
  })
  input.click()
}

async function exportPublicJson() {
  if (!client) return
  const gr = await client.from('chat_groups_public').select('*').order('order_index', { ascending: true })
  const sr = await client.from('public_catalog').select('*').order('order_index', { ascending: true })
  const payload = {
    groups: gr.data || [],
    scripts: (sr.data || []).map(s => ({
      id: s.id,
      groupId: s.group_id,
      title: s.title,
      note: s.note,
      content: s.content,
      order_index: s.order_index
    }))
  }
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

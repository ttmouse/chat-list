import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const urlEl=document.getElementById('inp-url')
const keyEl=document.getElementById('inp-key')
const tokenEl=document.getElementById('inp-token')
const tblPublic=document.querySelector('#tbl-public tbody')
const tblReq=document.querySelector('#tbl-requests tbody')

let client=null

const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
const getKV = async (keys) => {
  if (hasChrome) return await chrome.storage.local.get(keys);
  const res = {};
  keys.forEach(k => { res[k] = localStorage.getItem(k) || ''; });
  return res;
};
const setKV = async (obj) => {
  if (hasChrome) return await chrome.storage.local.set(obj);
  Object.entries(obj).forEach(([k,v]) => localStorage.setItem(k, v ?? ''));
};

async function loadConfig(){
  const r=await getKV(['SUPABASE_URL','SUPABASE_ANON_KEY','publishToken'])
  urlEl.value=r.SUPABASE_URL||''
  keyEl.value=r.SUPABASE_ANON_KEY||''
  tokenEl.value=r.publishToken||''
  if(urlEl.value&&keyEl.value){
    client=createClient(urlEl.value,keyEl.value)
    window.supabase=client
  }
}

async function saveConfig(){
  const url=urlEl.value.trim()
  const key=keyEl.value.trim()
  const token=tokenEl.value.trim()
  await setKV({SUPABASE_URL:url,SUPABASE_ANON_KEY:key,publishToken:token})
  if(url&&key){
    client=createClient(url,key)
    window.supabase=client
  }
}

async function loadPublic(){
  if(!client)return
  const gr=await client.from('chat_groups_public').select('*').order('order_index',{ascending:true})
  const sr=await client.from('public_catalog').select('*').eq('is_active',true).order('order_index',{ascending:true})
  tblPublic.innerHTML=(sr.data||[]).map(s=>{
    const g=(gr.data||[]).find(x=>x.id===s.group_id)
    return `<tr><td>${g?g.name:''}</td><td>${s.title}</td><td>${s.note||''}</td><td class="actions"><button data-id="${s.id}" class="btn-outline btn-del">删除</button></td></tr>`
  }).join('')
}

async function loadRequests(){
  if(!client)return
  const r=await client.from('publish_requests').select('*').order('updated_at',{ascending:false})
  tblReq.innerHTML=(r.data||[]).map(x=>{
    const p=x.payload||{}
    return `<tr><td><span class="badge">${x.status}</span></td><td>${p.title||''}</td><td>${(p.content||'').slice(0,120)}</td><td class="actions"><button class="btn" data-id="${x.id}" data-action="approve">通过</button><button class="btn-outline" data-id="${x.id}" data-action="reject">拒绝</button></td></tr>`
  }).join('')
}

async function approveRequest(id){
  const token=(await getKV(['publishToken'])).publishToken||null
  const r=await client.from('publish_requests').select('*').eq('id',id).limit(1)
  const row=(r.data||[])[0]
  if(!row)return
  const p=row.payload||{}
  const pub={id:p.id,group_id:p.group_id,title:p.title,note:p.note||'',content:p.content,order_index:p.order_index||0,is_active:true}
  await client.from('public_catalog').upsert(pub,{onConflict:'id'})
  await client.from('publish_requests').update({status:'approved',token}).eq('id',id)
  await loadPublic()
  await loadRequests()
}

async function rejectRequest(id){
  const token=(await getKV(['publishToken'])).publishToken||null
  await client.from('publish_requests').update({status:'rejected',token}).eq('id',id)
  await loadRequests()
}

tblPublic.addEventListener('click',async e=>{
  const btn=e.target.closest('.btn-del')
  if(!btn)return
  const id=btn.getAttribute('data-id')
  await client.from('public_catalog').delete().eq('id',id)
  await loadPublic()
})

tblReq.addEventListener('click',async e=>{
  const btn=e.target.closest('button')
  if(!btn)return
  const id=btn.getAttribute('data-id')
  const act=btn.getAttribute('data-action')
  if(act==='approve') await approveRequest(id)
  if(act==='reject') await rejectRequest(id)
})
function debounce(fn,delay){
  let t
  return function(){
    clearTimeout(t)
    t=setTimeout(()=>fn.apply(this,arguments),delay)
  }
}

const autoSave=debounce(async()=>{
  await saveConfig()
  if(client){
    await loadPublic()
    await loadRequests()
  }
  try{
    window.postMessage({type:'SUPABASE_CONFIG',SUPABASE_URL:urlEl.value.trim(),SUPABASE_ANON_KEY:keyEl.value.trim()},'*')
  }catch(_){}
},400)

urlEl.addEventListener('input',autoSave)
keyEl.addEventListener('input',autoSave)
tokenEl.addEventListener('input',autoSave)

loadConfig().then(async()=>{
  if(client){
    await loadPublic()
    await loadRequests()
  }
  try{
    window.postMessage({type:'SUPABASE_CONFIG',SUPABASE_URL:urlEl.value.trim(),SUPABASE_ANON_KEY:keyEl.value.trim()},'*')
  }catch(_){}
})
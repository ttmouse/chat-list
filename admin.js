import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const urlEl=document.getElementById('inp-url')
const keyEl=document.getElementById('inp-key')
const tokenEl=document.getElementById('inp-token')
const saveBtn=document.getElementById('btn-save')
const loadPublicBtn=document.getElementById('btn-load-public')
const loadReqBtn=document.getElementById('btn-load-requests')
const tblPublic=document.querySelector('#tbl-public tbody')
const tblReq=document.querySelector('#tbl-requests tbody')

let client=null

async function loadConfig(){
  const r=await chrome.storage.local.get(['SUPABASE_URL','SUPABASE_ANON_KEY','publishToken'])
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
  await chrome.storage.local.set({SUPABASE_URL:url,SUPABASE_ANON_KEY:key,publishToken:token})
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
  const token=(await chrome.storage.local.get(['publishToken'])).publishToken||null
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
  const token=(await chrome.storage.local.get(['publishToken'])).publishToken||null
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

saveBtn.addEventListener('click',saveConfig)
loadPublicBtn.addEventListener('click',loadPublic)
loadReqBtn.addEventListener('click',loadRequests)

loadConfig()
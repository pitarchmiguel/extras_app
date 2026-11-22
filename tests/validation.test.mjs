import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateEntry } from '../supabase/functions/personal-ledger/validation.mjs'
const id = '11111111-1111-4111-8111-111111111111'
const entry = { work_date:'2026-11-22',kind:'extra',duration_minutes:75,is_paid:false,is_signed:true,notes:'',attachment_path:null,attachment_name:null }
test('server rejects impossible dates and invalid durations',()=>{
  assert.throws(()=>validateEntry({...entry,work_date:'2026-02-30'},id))
  assert.throws(()=>validateEntry({...entry,duration_minutes:0},id))
  assert.throws(()=>validateEntry({...entry,duration_minutes:1441},id))
  assert.equal(validateEntry({...entry,work_date:'2028-02-29'},id).work_date,'2028-02-29')
})
test('server ignores ownership fields and rejects another record attachment',()=>{
  assert.equal('user_id' in validateEntry({...entry,user_id:'attacker'},id),false)
  assert.throws(()=>validateEntry({...entry,attachment_path:'personal/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.jpg',attachment_name:'hoja.jpg'},id))
  assert.throws(()=>validateEntry({...entry,attachment_path:'../other.jpg',attachment_name:'hoja.jpg'},id))
})

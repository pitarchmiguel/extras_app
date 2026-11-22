import { test } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/entries.js'

function response() {
  return { headers:{}, code:200, body:null, setHeader(k,v){this.headers[k]=v}, status(code){this.code=code;return this}, json(body){this.body=body;return this} }
}
const base = { method:'POST',headers:{host:'extras-app-pitarch.vercel.app',origin:'https://extras-app-pitarch.vercel.app','content-type':'application/json'},body:{action:'list'} }
test('proxy blocks cross-origin requests and unprotected custom domains',async()=>{
  const previous=process.env.VERCEL
  process.env.VERCEL='1'
  try {
    for (const headers of [{...base.headers,origin:'https://other.example'},{...base.headers,host:'custom.example',origin:'https://custom.example'}]) {
      const res=response();await handler({...base,headers},res);assert.equal(res.code,403)
    }
  } finally { if(previous===undefined)delete process.env.VERCEL;else process.env.VERCEL=previous }
})
test('proxy keeps its server credential out of the client response',async()=>{
  const previous=process.env.EXTRAS_API_KEY, originalFetch=globalThis.fetch
  process.env.EXTRAS_API_KEY='test-only-server-credential'
  let called=false
  globalThis.fetch=async(url,options)=>{
    called=true;assert.equal(options.headers['X-Extras-Key'],'test-only-server-credential')
    assert.equal(JSON.parse(options.body).action,'list')
    return Response.json({entries:[]})
  }
  try {
    const res=response();await handler(base,res)
    assert.equal(called,true);assert.equal(res.code,200);assert.deepEqual(res.body,{entries:[]})
    assert.equal(JSON.stringify(res.body).includes('test-only-server-credential'),false)
    assert.equal(res.headers['Cache-Control'],'private, no-store')
  } finally { globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.EXTRAS_API_KEY;else process.env.EXTRAS_API_KEY=previous }
})

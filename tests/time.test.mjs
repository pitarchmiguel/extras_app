import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDuration, formatDuration, summarize, csvCell } from '../src/lib/time.mjs'
test('las horas se almacenan en minutos sin errores decimales', () => {
  assert.equal(parseDuration('6','15'),375)
  assert.equal(formatDuration(375),'6 h 15 min')
  assert.equal(formatDuration(60),'1 h')
  for (const [h,m] of [[0,0],[24,1],[1,60],[-1,0],[1.5,0]]) assert.throws(()=>parseDuration(h,m))
})
test('pago y firma son estados independientes', () => {
  assert.deepEqual(summarize([
    {duration_minutes:75,kind:'extra',is_paid:true,is_signed:false},
    {duration_minutes:120,kind:'holiday',is_paid:false,is_signed:true},
  ]), {total:195,unpaid:120,unsigned:75,holiday:120})
})
test('el CSV escapa comillas y neutraliza fórmulas',()=>{
  assert.equal(csvCell('hoja "A"'),'"hoja ""A"""')
  assert.equal(csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"')
})

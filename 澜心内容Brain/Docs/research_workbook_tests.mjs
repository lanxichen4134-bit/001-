// Reproducible formula tests. In-memory simulated data only; never exports or edits source.
// Run with Node and @oai/artifact-tool available: node research_workbook_tests.mjs [blank-template.xlsx]
import {fileURLToPath} from 'node:url';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';
const source = process.argv[2] || fileURLToPath(new URL('./研究模板/05_评论研究数据与选题判断工作簿.xlsx',import.meta.url));
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const results=[];
const undo=[];
const sh=n=>wb.worksheets.getItem(n);
function put(n,r,v){const a=sh(n).getRange(r);undo.push([a,a.values]);a.values=v;}
function cell(n,r,v){put(n,r,[[v]]);}
function val(n,r){return sh(n).getRange(r).values[0][0];}
function expect(n,r,expected){const actual=val(n,r);if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(`${n}!${r}: expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);}
function fixture(){
 put('批次记录','A6:B8',[['B01','B2试取样'],['B02','B3正式研究'],['BV','B1能力验证']]);
 put('搜索记录','A6:D6',[['Q01','B01','K01','模拟搜索词']]);
 put('账号筛选','A6:A6',[['A01']]);
 put('笔记筛选','A6:F8',[
  ['N01','Q01','A01','B01','模拟笔记一','模拟来源一'],
  ['N02','Q01','A01','B02','模拟笔记二','模拟来源二'],
  ['NV','Q01','A01','BV','模拟能力测试笔记','模拟来源三']]);
 put('证据索引','A6:H8',[
  ['E01','N01','模拟来源一','模拟时间','模拟证据一','是','模拟对象','可定位'],
  ['E02','N02','模拟来源二','模拟时间','模拟证据二','是','模拟对象','可定位'],
  ['EV','NV','模拟来源三','模拟时间','模拟证据三','是','模拟对象','可定位']]);
 put('问题归类','A6:J7',[
  ['P01','模拟问题一','模拟场景','模拟显性问题','模拟推测','模拟反方','有效','是','模拟业务依据','模拟分类'],
  ['P02','模拟问题二','模拟场景','模拟显性问题','模拟推测','模拟反方','有效','是','模拟业务依据','模拟分类']]);
}
function observation(row,oid,cid,{batch='B01',scope='研究',note='N01',evidence='E01',locate='是',privacy='是',merge='已判定'}={}){
 put('评论证据',`A${row}:P${row}`,[[oid,batch,scope,cid,note,evidence,'模拟时间','模拟位置','模拟文本',merge,locate,privacy,'模拟限制','未显示','顶层','模拟判定']]);
}
function link(row,id,pid,cid,relation='支持'){
 put('问题评论关联',`A${row}:E${row}`,[[id,pid,cid,relation,'模拟关联依据']]);
}
function topic(){
 put('选题判断','A6:R6',[['T01','B01','P01','模拟候选','模拟受众','模拟目标','通过','通过','通过','通过','通过','S5','推荐','模拟审核人','模拟核验依据','待审',null,null]]);
 put('推荐理由','A6:L6',[['T01',...Array(10).fill('模拟理由'),'是']]);
 put('平台预审','A6:I8',['抖音','小红书','微信视频号'].map(p=>['T01',p,'需要补充审核或资料','模拟原因','模拟账号依据','规则未核','待核','模拟风险','待补模拟责任']));
}
async function test(name,fn){
 try{await fn();wb.recalculate();results.push({name,pass:true});}
 catch(e){results.push({name,pass:false,error:e.message});}
 finally{while(undo.length){const[a,v]=undo.pop();a.values=v;}wb.recalculate();}
}
await test('empty',()=>{expect('本轮汇总','B11','未执行');expect('本轮汇总','B16','未执行');});
await test('basic',()=>{fixture();observation(6,'O1','C1');link(6,'L1','P01','C1');expect('本轮汇总','B12',1);expect('本轮汇总','B14',1);expect('本轮汇总','B15',1);});
await test('observed_and_cross_batch_duplicates',()=>{fixture();observation(6,'O1','C1');observation(7,'O2','C1');observation(8,'O3','C1',{batch:'B02'});expect('本轮汇总','B11',3);expect('本轮汇总','B12',1);expect('批次记录','P7',1);expect('批次记录','Q7',0);});
await test('invalid_stays_denominator',()=>{fixture();observation(6,'O1','C1');observation(7,'O2','C2');link(6,'L1','P01','C1');expect('本轮汇总','B12',2);expect('本轮汇总','B16',0.5);});
await test('unlocatable_cannot_support',()=>{fixture();observation(6,'O1','C1',{locate:'否'});link(6,'L1','P01','C1');expect('本轮汇总','B14',0);expect('本轮汇总','B15',0);});
await test('one_comment_multiple_problems_and_duplicate_links',()=>{fixture();observation(6,'O1','C1');link(6,'L1','P01','C1');link(7,'L2','P02','C1');link(8,'L3','P01','C1');expect('本轮汇总','B15',1);expect('本轮汇总','B17',2);expect('问题归类','K6',1);});
await test('zero_denominator_U',()=>{fixture();observation(6,'O1','',{merge:'待核'});expect('本轮汇总','B12',0);expect('本轮汇总','B13',1);expect('本轮汇总','B16','不适用');});
await test('manual_approval_and_gate',()=>{
 fixture();observation(6,'O1','C1');link(6,'L1','P01','C1');topic();
 expect('本轮汇总','B19',1);expect('本轮汇总','B20',0);
 cell('选题判断','P6','认可');expect('本轮汇总','B20',0);
 cell('选题判断','Q6','SIMULATED-v1');expect('本轮汇总','B20',1);
 for(const col of ['G','H','I','J','K']){
  cell('选题判断',`${col}6`,'待补证');
  expect('本轮汇总','B19',0);expect('本轮汇总','B20',0);
  cell('选题判断',`${col}6`,'通过');
 }
});
await test('late_location_evidence',()=>{fixture();observation(6,'O1','C1',{locate:'否'});observation(7,'O2','C1');link(6,'L1','P01','C1');expect('本轮汇总','B14',1);expect('本轮汇总','B15',1);});
await test('B1_counterexample_excluded',()=>{fixture();observation(6,'OV','CV',{batch:'BV',scope:'能力验证',note:'NV',evidence:'EV'});link(6,'L1','P01','CV','反例');expect('问题归类','M6',0);});
await test('B1_same_CID_not_support_note',()=>{fixture();observation(6,'OV','C1',{batch:'BV',scope:'能力验证',note:'NV',evidence:'EV'});observation(7,'O1','C1');link(6,'L1','P01','C1');expect('问题评论关联','F6','N01');});
await test('B1_time_not_formal_zero',()=>{fixture();cell('批次记录','J8',10);expect('本轮汇总','B24','待记录');});
await test('capacity_last_row',()=>{fixture();observation(205,'O200','C200');link(205,'L200','P01','C200');expect('本轮汇总','B11',1);expect('本轮汇总','B15',1);});
console.log(JSON.stringify(results,null,2));
expect('本轮汇总','B11','未执行');
expect('本轮汇总','B20','未执行');
if(results.some(x=>!x.pass)) process.exitCode=1;
console.log('LIMIT: simulated records and formula behavior; no browser access, medical verification or human approval established. Source was not written.');

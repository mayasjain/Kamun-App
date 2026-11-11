import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(process.env.PADLET_LOAD_DRIVER ?? '/tmp/kamun-padlet-load-300/package.json');
const { Client } = require('pg');
const config = { host: '127.0.0.1', port: 55439, user: 'postgres', password: 'local-load-only', database: 'padlet_load', connectionTimeoutMillis: 15000 };
const conference = '10000000-0000-4000-8000-000000000001';
const uid = n => `80000000-0000-4000-8000-${String(n + 1).padStart(12, '0')}`;
const admin = new Client(config);
const clients = [];
const results = { date: new Date().toISOString(), users: 300, scope: 'Local PostgreSQL, 300 independent sessions; Auth/Storage schemas stubbed, no image bytes or hosted APIs', scenarios: [] };
function summary(values) {
 const sorted = [...values].sort((a,b) => a-b);
 return { count: sorted.length, p50_ms: Math.round(sorted[Math.floor(sorted.length*.5)] ?? 0), p95_ms: Math.round(sorted[Math.floor(sorted.length*.95)] ?? 0), max_ms: Math.round(sorted.at(-1) ?? 0) };
}
async function burst(name, operation, expectedRejection = () => false) {
 const start = performance.now();
 const outcomes = await Promise.all(clients.map(async (client, i) => {
  const t = performance.now();
  try { return { ok: true, value: await operation(client, i), ms: performance.now()-t }; }
  catch (e) { return { ok: false, expected: expectedRejection(e), error: `${e.code}: ${e.message}`, ms: performance.now()-t }; }
 }));
 const errors = {};
 for (const o of outcomes.filter(o => !o.ok)) errors[o.error] = (errors[o.error] ?? 0)+1;
 const row = { name, elapsed_ms: Math.round(performance.now()-start), accepted: outcomes.filter(o => o.ok).length, expected_rejections: outcomes.filter(o => !o.ok && o.expected).length, unexpected_errors: outcomes.filter(o => !o.ok && !o.expected).length, latency: summary(outcomes.map(o => o.ms)), errors };
 results.scenarios.push(row);
 console.log(JSON.stringify(row));
 assert.equal(row.unexpected_errors, 0, `${name}: unexpected errors`);
 return outcomes;
}
try {
 await admin.connect();
 await admin.query(await readFile(new URL('./bootstrap.sql', import.meta.url), 'utf8'));
 results.migrations = {};
 for (const file of JSON.parse(await readFile(new URL('./migrations.json', import.meta.url),'utf8'))) {
  const sql = await readFile(new URL('../../../supabase/migrations/'+file,import.meta.url),'utf8');
  results.migrations[file] = createHash('sha256').update(sql).digest('hex');
  await admin.query(sql);
  if (file === '202609300001_initial_kamun.sql') await admin.query(`
   insert into public.conferences(id,slug,name,starts_at,ends_at,published) values('${conference}','test','Test',now(),now()+interval '1 day',true);
   insert into public.committees(id,conference_id,name,abbreviation,published) values('20000000-0000-4000-8000-000000000001','${conference}','ILO','ILO',true);
  `);
 }
 results.postgres = (await admin.query('select version()')).rows[0].version;

 await admin.query(`insert into auth.users(id,aud,role,email,created_at,updated_at)
 select ('80000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','load-'||n||'@example.invalid',now(),now() from generate_series(1,300) n`);
 await admin.query(`set role service_role; select set_config('request.jwt.claim.role','service_role',false)`);
 await admin.query(`select public.ecg_bind_verified_identity($1,('80000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,900000+n,'delegate','ILO','Load '||n,repeat('d',64)) from generate_series(1,300) n`, [conference]);
 await admin.query('reset role');
 await Promise.all(Array.from({length:300}, async (_,i) => {
  const c = new Client(config); clients[i] = c;
  await c.connect();
  await c.query("set role authenticated; set statement_timeout='8s'");
  await c.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)", [uid(i)]);
 }));
 const uploads = await burst('300 simultaneous reserve / Storage metadata insert / post flows', async (c,i) => {
  const path = (await c.query('select public.reserve_meme_upload($1,$2) path',[conference,'image/png'])).rows[0].path;
  await c.query("insert into storage.objects(bucket_id,name,owner_id) values('committee-memes',$1,$2)", [path,uid(i)]);
  return (await c.query('select public.post_committee_meme($1,null,$2,$3) id',[conference,path,`Load ${i}`])).rows[0].id;
 });
 assert.equal(uploads.filter(o=>o.ok).length,300);
 const ids = uploads.map(o=>o.value), hot = ids[0];
 assert.equal(Number((await admin.query('select count(*) n from public.committee_memes')).rows[0].n),300);
 await burst('300 upvotes on one post', c=>c.query('select public.set_meme_vote($1,1)',[hot]));
 assert.equal(Number((await admin.query('select count(*) n from public.meme_votes where value=1')).rows[0].n),300);
 await burst('300 vote switches on one post', c=>c.query('select public.set_meme_vote($1,-1)',[hot]));
 assert.equal(Number((await admin.query('select count(*) n from public.meme_votes where value=-1')).rows[0].n),300);
 await burst('300 comments competing for the 200-comment post cap', c=>c.query('select public.add_meme_comment($1,$2)',[hot,'Hot post load test']), e=>e.code==='54000' && e.message.includes('meme has reached its comment limit'));
 assert.equal(Number((await admin.query('select count(*) n from public.meme_comments where meme_id=$1',[hot])).rows[0].n),200);
 // One comment on each separate post; user zero's hot post is already at its cap.
 const comments = await burst('299 distributed comments plus one intentionally full post', (c,i)=>c.query('select public.add_meme_comment($1,$2) id',[ids[i],'Distributed load test']), e=>e.code==='54000' && e.message.includes('meme has reached its comment limit'));
 assert.equal(comments.filter(o=>o.ok).length,299);
 await burst('299 own comment removals alongside one thread read', (c,i)=> i===0 ? c.query('select * from public.list_meme_comments($1)',[hot]) : c.query('select public.remove_meme_comment($1) removed',[comments[i].value.rows[0].id]).then(r=>assert.equal(r.rows[0].removed,true)));
 const polls = [], writes = [], lag = [];
 const start = performance.now();
 // Fifteen synchronized ticks, each matching gallery + moderation + activity + open-thread RPC reads.
 for (let tick=0; tick<15; tick++) {
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,start+tick*2000-performance.now())));
  lag.push(Math.max(0,performance.now()-(start+tick*2000)));
  await Promise.all(clients.map(async (c,i)=> {
   const t=performance.now();
   const gallery=await c.query('select * from public.list_committee_memes($1,null,null)',[conference]);
   assert.equal(gallery.rows.length,24);
   const w=performance.now();
   await c.query('select public.set_meme_vote($1,$2)',[tick%3===0 ? hot : ids[i],tick%2===0 ? 1 : -1]);
   writes.push(performance.now()-w);
   await c.query('select public.can_moderate_meme_gallery($1,null)',[conference]);
   const activity=await c.query('select * from public.get_meme_activity($1::uuid[])',[gallery.rows.map(r=>r.id)]);
   assert.equal(activity.rows.length,24);
   const thread=await c.query('select * from public.list_meme_comments($1)',[hot]);
   assert.equal(thread.rows.length,20);
   polls.push(performance.now()-t);
  }));
 }
 const polling = { name:'300 readers at 2-second intervals for 15 cycles, with 300 vote writes each cycle', elapsed_ms:Math.round(performance.now()-start), viewer_refreshes: polls.length, read_rpc_requests:polls.length*4, vote_writes:writes.length, refresh_latency:summary(polls), write_latency:summary(writes), schedule_lag:summary(lag), unexpected_errors:0 };
 results.scenarios.push(polling); console.log(JSON.stringify(polling));
 assert.equal(polls.length,4500); assert.equal(writes.length,4500);
 // Last tick is an upvote on each user's own post. Every person has exactly one vote per target.
 assert.equal(Number((await admin.query('select count(*) n from public.meme_votes where meme_id=$1',[hot])).rows[0].n),300);
 const extreme = [], extremeLag = [];
 const extremeStart = performance.now();
 for (let tick=0;tick<5;tick++) {
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,extremeStart+tick*2000-performance.now())));
  extremeLag.push(Math.max(0,performance.now()-(extremeStart+tick*2000)));
  await Promise.all(clients.map(async (c,i)=> {
   const t=performance.now();
   const gallery=await c.query('select * from public.list_committee_memes($1,null,null)',[conference]);
   await c.query('select public.can_moderate_meme_gallery($1,null)',[conference]);
   await c.query('select * from public.get_meme_activity($1::uuid[])',[gallery.rows.map(r=>r.id)]);
   for (const post of gallery.rows) await c.query('select * from public.list_meme_comments($1)',[post.id]);
   await c.query('select public.set_meme_vote($1,$2)',[ids[i],tick%2===0 ? 1 : -1]);
   extreme.push(performance.now()-t);
  }));
 }
 const worst={name:'Extreme: 300 viewers each refresh 24 open comment threads plus gallery/totals and vote, five 2-second ticks',elapsed_ms:Math.round(performance.now()-extremeStart),viewer_refreshes:extreme.length,read_rpc_requests:extreme.length*27,vote_writes:extreme.length,refresh_latency:summary(extreme),refreshes_over_2s:extreme.filter(ms=>ms>2000).length,schedule_lag:summary(extremeLag),unexpected_errors:0};
 results.scenarios.push(worst);console.log(JSON.stringify(worst));
 await admin.query("update public.meme_upload_budgets set issued=1990 where budget_key='bucket'");
 const cap = await burst('300 upload reservations compete for the last 10 bucket slots', c=>c.query('select public.reserve_meme_upload($1,$2)',[conference,'image/png']), e=>e.code==='54000' && e.message==='The gallery upload capacity has been reached');
 assert.equal(cap.filter(o=>o.ok).length,10);
 assert.equal(Number((await admin.query("select issued from public.meme_upload_budgets where budget_key='bucket'")).rows[0].issued),2000);
 results.passed=true;
} catch(e) { results.passed=false; results.failure=e.stack; console.error(e); process.exitCode=1; }
finally {
 await writeFile(new URL('./results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
 await Promise.allSettled(clients.map(c=>c.end())); await admin.end();
}

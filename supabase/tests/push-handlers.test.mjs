import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import ts from '../../apps/mobile/node_modules/typescript/lib/typescript.js';
const dir=mkdtempSync(join(tmpdir(),'push-handlers-'));
writeFileSync(join(dir,'package.json'),'{"type":"module"}');
writeFileSync(join(dir,'stub.js'),'export const createClient=(...args)=>globalThis.__client(...args); export default {sendNotification:(...args)=>globalThis.__send(...args)};');
for(const name of ['_shared','push-subscribe','push-dispatch']) mkdirSync(join(dir,name));
for(const file of ['_shared/ecg.ts','_shared/web-push.ts','push-subscribe/index.ts','push-dispatch/index.ts']) {
 const source=readFileSync(new URL('../functions/'+file,import.meta.url),'utf8').replaceAll('npm:@supabase/supabase-js@2','../stub.js').replaceAll('npm:web-push@3.6.7','../stub.js').replaceAll('../_shared/ecg.ts','../_shared/ecg.js').replaceAll('../_shared/web-push.ts','../_shared/web-push.js');
 writeFileSync(join(dir,file.replace('.ts','.js')),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const env=new Map(Object.entries({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server',WEB_PUSH_PUBLIC_KEY:'public-vapid',WEB_PUSH_PRIVATE_KEY:'private-vapid',WEB_PUSH_DISPATCH_KEY:'scheduler-secret',ECG_INTEGRATION_URL:'https://cafe.example.test',ECG_INTEGRATION_KEY:'integration-secret-at-least-32-characters'}));
const handlers={};
globalThis.Deno={env:{get:key=>env.get(key)},serve:handler=>{handlers[globalThis.__handler]=handler;}};
for(const name of ['push-subscribe','push-dispatch']) {globalThis.__handler=name;await import(pathToFileURL(join(dir,name,'index.js')));}
const {validPushEndpoint,validPushKeys}=await import(pathToFileURL(join(dir,'_shared/web-push.js')));
const endpoint='https://web.push.apple.com/fake-endpoint';
const keys={p256dh:'A'.repeat(87),auth:'B'.repeat(22)};
const conferenceId='10000000-0000-4000-8000-000000000001';
const req=(body={},headers={})=>new Request('https://functions.example.test',{method:'POST',headers:{Authorization:'Bearer session','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const job={delivery_id:'delivery',lease_id:'lease',subscription_id:'subscription',announcement_id:'announcement',endpoint,...keys,person_id:101,revision:'a'.repeat(64),kind:'delegate',committee:'ILO',seat:'Fixture'};
const identity={personId:101,revision:job.revision,kind:'delegate',committee:'ILO',seat:'Fixture'};
function setup({eligible=true,providerStatus,upstreamStatus=200,changed=false}={}) {
 const calls=[],messages=[];
 globalThis.__client=(_url,key)=>key==='public'?{auth:{getUser:async token=>({data:{user:token==='session'?{id:'user'}:null},error:null})}}:{
  rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='web_push_claim'?[job]:name==='web_push_eligible'?eligible:null,error:null};},
  from:table=>({update:value=>({eq:async()=>{calls.push([table,value]);return {error:null};}})}),
 };
 globalThis.fetch=async()=>new Response(JSON.stringify(changed?{...identity,revision:'b'.repeat(64)}:identity),{status:upstreamStatus});
 globalThis.__send=async(...args)=>{messages.push(args);if(providerStatus)throw {statusCode:providerStatus,message:'do not expose endpoint or credentials'};};
 return {calls,messages};
}
test('only known HTTPS push-provider endpoints and correctly shaped keys are accepted',()=>{
 for(const value of [endpoint,'https://fcm.googleapis.com/fcm/send/fake','https://updates.push.services.mozilla.com/wpush/v2/fake']) assert.ok(validPushEndpoint(value));
 for(const value of ['https://evil.example','http://fcm.googleapis.com/x','https://fcm.googleapis.com.evil.example/x','https://user:pass@fcm.googleapis.com/x','https://fcm.googleapis.com:8080/x','https://127.0.0.1/x',null]) assert.equal(validPushEndpoint(value),false);
 assert.ok(validPushKeys(keys));assert.ok(validPushKeys({p256dh:keys.p256dh+'=',auth:keys.auth+'=='}));assert.equal(validPushKeys({...keys,auth:'x'}),false);
});
test('registration authenticates and derives user and role on the server',async()=>{
 const {calls}=setup();
 let response=await handlers['push-subscribe'](req({action:'subscribe',endpoint,keys,conferenceId,userId:'attacker',kind:'kamun_admin'}));
 assert.equal(response.status,200);assert.equal(calls[0][0],'web_push_register');assert.equal(calls[0][1].p_user,'user');assert.equal(calls[0][1].kind,undefined);
 response=await handlers['push-subscribe'](req({action:'subscribe',endpoint:'https://localhost/x',keys,conferenceId}));assert.equal(response.status,400);
 response=await handlers['push-subscribe'](req({action:'config'},{Authorization:'Bearer invalid'}));assert.equal(response.status,401);
 response=await handlers['push-subscribe'](req({action:'config'}));assert.deepEqual(await response.json(),{publicKey:'public-vapid'});
});
test('dispatch requires its dedicated secret, not an ordinary user session',async()=>{
 setup();assert.equal((await handlers['push-dispatch'](req())).status,401);
 assert.equal((await handlers['push-dispatch'](req({}, {'X-Push-Dispatch-Key':'wrong'}))).status,401);
});
test('delivery rechecks audience and ECE identity; sends generic payload with bounded TTL',async()=>{
 const {calls,messages}=setup();
 const response=await handlers['push-dispatch'](req({}, {'X-Push-Dispatch-Key':'scheduler-secret'}));
 assert.equal(response.status,200);assert.equal(messages.length,1);
 assert.equal(calls.filter(c=>c[0]==='web_push_eligible').length,2);
 assert.deepEqual(JSON.parse(messages[0][1]),{tag:'kamun-announcement'});
 assert.equal(messages[0][2].TTL,300);assert.equal(messages[0][2].timeout,8000);
 assert.equal(calls.at(-1)[1].p_state,'sent');
 assert.equal((await response.text()).includes('private-vapid'),false);
});
test('wrong audience, removed announcement or changed credential prevents delivery',async()=>{
 for(const options of [{eligible:false},{changed:true}]) {
  const {calls,messages}=setup(options);await handlers['push-dispatch'](req({}, {'X-Push-Dispatch-Key':'scheduler-secret'}));
  assert.equal(messages.length,0);assert.equal(calls.at(-1)[1].p_state,'skipped');
 }
});
test('upstream outages and provider throttling retry; expired endpoints are disabled',async()=>{
 for(const options of [{upstreamStatus:503},{providerStatus:429},{providerStatus:410}]) {
  const {calls}=setup(options);const response=await handlers['push-dispatch'](req({}, {'X-Push-Dispatch-Key':'scheduler-secret'}));
  assert.equal(calls.at(-1)[1].p_state,options.providerStatus===410?'skipped':'pending');
  if(options.providerStatus===410) assert.ok(calls.some(c=>c[0]==='web_push_subscriptions'&&c[1].enabled===false));
  assert.equal((await response.text()).includes('credentials'),false);
 }
});

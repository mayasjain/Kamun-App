import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from '../node_modules/typescript/lib/typescript.js';
const events={},notifications=[],messages=[];
let navigated,focused=false,opened;
const self={location:{origin:'https://kamun.example'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:()=>{},registration:{showNotification:async(...args)=>notifications.push(args),getNotifications:async()=>[]},clients:{claim:async()=>{},matchAll:async()=>[{url:'https://kamun.example/',postMessage:data=>messages.push(data),navigate:async url=>{navigated=url;},focus:async()=>{focused=true;}}],openWindow:async url=>{opened=url;}}};
vm.runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL});
test('push always displays a generic alert, refreshes visible clients, and never exposes announcement content',async()=>{
 let pending;events.push({data:{json:()=>({tag:'kamun-10000000-0000-4000-8000-000000000001',title:'Private title',url:'https://evil.example'})},waitUntil:p=>{pending=p;}});await pending;
 assert.equal(notifications[0][0],'Secretariat announcement');assert.equal(notifications[0][1].body,'Tap to read the latest update.');assert.equal(notifications[0][1].body.includes('Private'),false);assert.equal(notifications[0][1].data.url,'/updates');assert.equal(messages[0].type,'KAMUN_UPDATE');
 events.push({data:{json:()=>{throw Error('bad payload');}},waitUntil:p=>{pending=p;}});await pending;assert.equal(notifications.length,2);
});
test('notification clicks open only the same-origin Updates route',async()=>{
 let pending,closed=false;events.notificationclick({notification:{data:{url:'https://evil.example'},close:()=>{closed=true;}},waitUntil:p=>{pending=p;}});await pending;
 assert.equal(navigated,'https://kamun.example/updates');assert.equal(focused,true);assert.equal(closed,true);assert.equal(opened,undefined);
});
const dir=mkdtempSync(join(tmpdir(),'push-client-'));
writeFileSync(join(dir,'package.json'),'{"type":"module"}');
writeFileSync(join(dir,'stub.js'),`export const KAMUN_CONFERENCE_ID='conference';export const supabase={functions:{invoke:(...args)=>globalThis.__pushInvoke(...args)}};`);
const source=readFileSync(new URL('../src/lib/web-push-client.ts',import.meta.url),'utf8').replaceAll("'@/lib/supabase'","'./stub.js'").replaceAll("'@/lib/conference-id'","'./stub.js'");
writeFileSync(join(dir,'client.js'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const client=await import(pathToFileURL(join(dir,'client.js')));
const steps=[];
const subscription={options:{},endpoint:'https://fcm.googleapis.com/fake',toJSON:()=>({keys:{p256dh:'A',auth:'B'}}),unsubscribe:async()=>steps.push('browser-unsubscribe')};
const registration={pushManager:{getSubscription:async()=>subscription},active:{postMessage:()=>{}}};
function browser(ios=false,standalone=true){
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:ios?'iPhone':'Android',platform:ios?'iPhone':'Linux',maxTouchPoints:0,serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration),getRegistration:async()=>registration}}});
 globalThis.window={isSecureContext:true,matchMedia:()=>({matches:standalone}),PushManager:{},Notification:{}};
 globalThis.Notification={permission:'granted',requestPermission:()=>{steps.push('permission');return Promise.resolve('granted');}};
}
test('iPhone needs Home Screen installation; Android and installed iPhone detect push support',()=>{
 browser(true,false);assert.equal(client.pushSupport(),'install');browser(true,true);assert.equal(client.pushSupport(),'supported');browser();assert.equal(client.pushSupport(),'supported');
});
test('permission is requested directly from the tap before any backend work',async()=>{
 browser();steps.length=0;globalThis.__pushInvoke=async(_name,{body})=>{steps.push(body.action);return {data:body.action==='config'?{publicKey:'AQID'}:{ok:true},error:null};};
 await client.enablePush();assert.deepEqual(steps,['permission','config','subscribe']);
});
test('turning off alerts disables the server first; a failed request retains the browser subscription for retry',async()=>{
 browser();steps.length=0;globalThis.__pushInvoke=async()=>({data:null,error:new Error('offline')});await assert.rejects(client.disablePush());assert.equal(steps.length,0);
 globalThis.__pushInvoke=async()=>{steps.push('server-disable');return {data:{ok:true},error:null};};await client.disablePush();assert.deepEqual(steps,['server-disable','browser-unsubscribe']);
});

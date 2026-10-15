import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {parseJSON} from './core.mjs';
export function gatewayKey(config) {
  if(process.env[config.gateway.apiKeyEnv]) return process.env[config.gateway.apiKeyEnv];
  if(!config.gateway.omniRouteDb) throw Error('Gateway key missing. Set API key env or omniRouteDb.');
  const db=new DatabaseSync(config.gateway.omniRouteDb,{readOnly:true});
  try { const rows=db.prepare("SELECT key,expires_at FROM api_keys WHERE name='AI YouTube MVP' AND is_active=1 AND is_banned=0 AND revoked_at IS NULL ORDER BY created_at DESC").all(); const row=rows.find(r=>!r.expires_at||Date.parse(r.expires_at)>Date.now()); if(!row?.key) throw Error('No active OmniRoute API key named AI YouTube MVP'); return row.key; } finally {db.close();}
}
export async function models(config) {const r=await fetch(config.gateway.baseUrl+'/models',{headers:{Authorization:'Bearer '+gatewayKey(config)},signal:AbortSignal.timeout(15000)}); if(!r.ok) throw Error('Gateway models HTTP '+r.status);return (await r.json()).data.map(x=>x.id);}
export async function agent(config,state,save,role,prompt,options={}) {
  if((state.agentCalls||0)>=config.maxAgentCallsPerJob) throw Error('Agent call limit reached');
  state.agentCalls=(state.agentCalls||0)+1; await save();
  const r=await fetch(config.gateway.baseUrl+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+gatewayKey(config)},body:JSON.stringify({model:config.models[role],stream:false,messages:[{role:'system',content:'Return one valid JSON object only. No markdown. Do not invent researched sources or claim you used tools. Vietnamese text.'},{role:'user',content:prompt}],max_tokens:options.maxTokens||3000}),signal:AbortSignal.timeout(config.gateway.timeoutMs)});
  if(!r.ok) throw Error(`Agent ${role}: HTTP ${r.status}`);
  const data=await r.json(); const content=data.choices?.[0]?.message?.content; if(typeof content!=='string'||!content.trim())throw Error('Gateway returned no text; finish reason: '+(data.choices?.[0]?.finish_reason||'unknown'));
  if(data.choices?.[0]?.finish_reason==='length')throw Error('Agent JSON truncated; shorten request or raise output limit');
  const value=parseJSON(content); state.usage??=[]; state.usage.push({role,model:config.models[role],usage:data.usage??null}); await save(); return value;
}

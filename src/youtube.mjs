import fs from 'node:fs/promises';
import path from 'node:path';
import {hash} from './core.mjs';
export async function accessToken(config) {
  const y=config.youtube;const client_id=process.env[y.clientIdEnv],client_secret=process.env[y.clientSecretEnv],refresh_token=process.env[y.refreshTokenEnv];
  if(!client_id||!client_secret||!refresh_token)throw Error('Missing YouTube OAuth env vars; see README');
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id,client_secret,refresh_token,grant_type:'refresh_token'}),signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error('OAuth HTTP '+r.status);return (await r.json()).access_token;
}
export async function upload(config,dir,state,save) {
  const bytes=await fs.readFile(path.join(dir,'video.mp4'));if(state.approvedHash!==hash(bytes))throw Error('Video must be approved; current hash differs');if(state.youtubeId)return state.youtubeId;
  const token=await accessToken(config);const headers={Authorization:'Bearer '+token};
  if(!state.uploadSession){const r=await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',{method:'POST',headers:{...headers,'Content-Type':'application/json','X-Upload-Content-Length':String(bytes.length),'X-Upload-Content-Type':'video/mp4'},body:JSON.stringify({snippet:{title:state.script.title,description:state.script.description||'',defaultLanguage:'vi',categoryId:'27'},status:{privacyStatus:'private',selfDeclaredMadeForKids:false,containsSyntheticMedia:state.disclosure===true}}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Start upload HTTP '+r.status);state.uploadSession=r.headers.get('location');if(!state.uploadSession)throw Error('No upload session');await save();}
  const target=new URL(state.uploadSession);if(target.protocol!=='https:'||!['www.googleapis.com','youtube.googleapis.com'].includes(target.hostname))throw Error('Invalid upload session origin');
  let offset=0;const status=await fetch(target,{method:'PUT',headers:{...headers,'Content-Length':'0','Content-Range':`bytes */${bytes.length}`},signal:AbortSignal.timeout(30000)});
  if(status.ok){const data=await status.json();if(!data.id)throw Error('Missing video ID');state.youtubeId=data.id;await save();return data.id;}
  if(status.status!==308)throw Error('Upload session HTTP '+status.status+'; inspect session before restarting');const range=status.headers.get('range');if(range)offset=Number(range.match(/-(\d+)$/)?.[1])+1;
  while(offset<bytes.length){const end=Math.min(offset+8*1024*1024,bytes.length);const r=await fetch(target,{method:'PUT',headers:{...headers,'Content-Type':'video/mp4','Content-Length':String(end-offset),'Content-Range':`bytes ${offset}-${end-1}/${bytes.length}`},body:bytes.subarray(offset,end),signal:AbortSignal.timeout(120000)});if(r.ok){const data=await r.json();if(!data.id)throw Error('Missing video ID');state.youtubeId=data.id;state.stage='uploaded';await save();return data.id;}if(r.status!==308)throw Error('Upload HTTP '+r.status+'; rerun to resume');const acknowledged=r.headers.get('range');if(!acknowledged)throw Error('Upload progress missing');offset=Number(acknowledged.match(/-(\d+)$/)?.[1])+1;if(!Number.isFinite(offset)||offset<end)throw Error('Upload progress incomplete; rerun to resume');}
  throw Error('Upload has no final response; rerun to query session');
}

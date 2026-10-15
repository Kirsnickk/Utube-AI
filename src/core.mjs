import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const hash = v => createHash('sha256').update(v).digest('hex');
export async function readJSON(p) { return JSON.parse((await fs.readFile(p,'utf8')).replace(/^\uFEFF/,'')); }
export async function writeJSON(p,v) { await fs.mkdir(path.dirname(p),{recursive:true}); const t=p+'.tmp'; await fs.writeFile(t,JSON.stringify(v,null,2)); await fs.rename(t,p); }
export function jobPath(root,id) { if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw Error('Invalid job ID'); return path.join(root,'jobs',id); }
export async function locked(dir,fn) { await fs.mkdir(dir,{recursive:true}); const p=path.join(dir,'.lock'); let h; try { h=await fs.open(p,'wx'); } catch { throw Error('Job locked. If prior process crashed, use unlock command after checking it is stopped.'); } try { await h.writeFile(String(process.pid)); return await fn(); } finally { await h.close(); await fs.unlink(p); } }
export function parseJSON(text) { const clean=text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''); return JSON.parse(clean); }
export function validateScript(v) { if(!v || typeof v.title!=='string' || v.title.length>100 || !Array.isArray(v.scenes) || v.scenes.length<2 || v.scenes.length>8) throw Error('Invalid script schema'); if(!Array.isArray(v.sources)) throw Error('sources must be an array'); for(const s of v.scenes) { if(typeof s.heading!=='string'||s.heading.length>85||typeof s.narration!=='string'||s.narration.length<10||s.narration.length>600) throw Error('Invalid scene'); } return v; }
export function validateDesign(v) { if(!/^#[0-9a-f]{6}$/i.test(v.accent)||!Array.isArray(v.labels)||v.labels.some(x=>typeof x!=='string'||x.length>55)) throw Error('Invalid design schema'); return v; }
export const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

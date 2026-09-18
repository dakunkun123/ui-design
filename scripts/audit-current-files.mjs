import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),src=path.join(root,'src');
const files=fs.readdirSync(src).filter(f=>/\.(jsx?|mjs|css)$/.test(f));
const visited=new Set();
function walk(file){if(visited.has(file)||!fs.existsSync(file))return;visited.add(file);const txt=fs.readFileSync(file,'utf8');for(const m of txt.matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.[^'"]+)['"]/g)){const p=path.resolve(path.dirname(file),m[1]);walk(p);}}
walk(path.join(src,'main.jsx'));
for(const f of fs.readdirSync('tests'))if(/\.(mjs|js)$/.test(f))walk(path.resolve('tests',f));
const unusedSource=files.filter(f=>!visited.has(path.join(src,f)));
const text=[...visited].map(f=>fs.readFileSync(f,'utf8')).join('\n');
// Runtime-generated paths must be explicitly included, not just literal URL matches.
const generated=/^(letter-.+-v16|(?:willow|maple|bamboo|wash|fish)-\d-v29|crane-(?:body|wing-near|wing-far)-v24|maple-v27-[01]|ribbon-v23)$/;
const assets=fs.readdirSync('public/assets');
const unusedAssets=assets.filter(f=>{const stem=f.replace(/\.[^.]+$/,'');return !text.includes(stem)&&!generated.test(stem);});
const keepScripts=new Set(['prepare-sites-build.mjs','prepare-v30-assets.mjs','study-v30-video.py','subset-fonts.py','audit-current-files.mjs','cleanup-legacy.ps1']);
const candidates=[...unusedSource.map(f=>'src/'+f),...unusedAssets.map(f=>'public/assets/'+f),...fs.readdirSync('docs').filter(f=>f!=='v30').map(f=>'docs/'+f),...fs.readdirSync('scripts').filter(f=>!keepScripts.has(f)).map(f=>'scripts/'+f),'qa','tmp/v27','PLAN.md','design-qa.md'];
if(process.argv.includes('--manifest')){
 const manifest=candidates.filter(p=>fs.existsSync(p)).map(p=>({path:p,absolute:path.resolve(p)}));
 fs.writeFileSync('docs/v30/cleanup-manifest.json',JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({targets:manifest.length,unusedSource,unusedAssets},null,2));
}else console.log(JSON.stringify({unusedSource,unusedAssets},null,2));

import sharp from 'sharp';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
const root=process.cwd();
const i18n=await readFile(`${root}/src/lib/i18n.ts`,'utf8');
const cats=[...i18n.slice(i18n.indexOf('export const kidsCategories'),i18n.indexOf('export const categories')).matchAll(/'([a-z-]+)'/g)].map(m=>m[1]);
await mkdir(`${root}/public/images/optimized/banners`,{recursive:true});
await mkdir(`${root}/public/images/optimized/categories`,{recursive:true});
let before=0,after=0; const missing=[];
for(let i=0;i<cats.length;i+=5) await Promise.all(cats.slice(i,i+5).map(async cat=>{
 const icon=await readFile(`${root}/public/images/category-icons/${cat}.png`).catch(()=>null);
 if(icon){ const result=await sharp(icon).resize(300,300,{fit:'cover'}).webp({quality:80}).toBuffer(); await writeFile(`${root}/public/images/optimized/categories/${cat}.webp`,result);before+=icon.length;after+=result.length; }
 const response=await fetch(`https://cdn.colotopia.com/banners/${cat}.png`,{signal:AbortSignal.timeout(20000)});
 if(!response.ok){missing.push(cat);return;}
 const data=Buffer.from(await response.arrayBuffer()); const result=await sharp(data).resize({width:1000,withoutEnlargement:true}).webp({quality:78}).toBuffer();await writeFile(`${root}/public/images/optimized/banners/${cat}.webp`,result);before+=data.length;after+=result.length;
}));
await writeFile(`${root}/src/data/category-banners.json`, JSON.stringify(cats.filter(cat => !missing.includes(cat)).sort(), null, 2) + '\n');
console.log(JSON.stringify({categories:cats.length,before,after,missing}));

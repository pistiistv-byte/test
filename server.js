import express from "express";
const app=express(); const PORT=process.env.PORT||3000;
app.use(express.static("."));
async function safeJson(url,options={}){try{const r=await fetch(url,{...options,headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json",...(options.headers||{})}});if(!r.ok)return null;return await r.json()}catch(e){return null}}
async function avatar(id){for(const url of [`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`,`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`]){const j=await safeJson(url);const img=j?.data?.[0]?.imageUrl;if(img)return img}return `https://www.roblox.com/headshot-thumbnail/image?userId=${id}&width=150&height=150&format=png`}
app.get("/api/roblox-users",async(req,res)=>{const username=String(req.query.username||"").trim();if(username.length<3)return res.json({users:[]});const found=new Map();async function add(u){if(!u||!u.id||!u.name||found.has(u.id))return;found.set(u.id,{id:u.id,name:u.name,displayName:u.displayName||u.name,avatar:await avatar(u.id)})}for(const url of ["https://users.roblox.com/v1/usernames/users","https://users.roproxy.com/v1/usernames/users"]){const j=await safeJson(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({usernames:[username],excludeBannedUsers:true})});for(const u of (j?.data||[]))await add(u)}for(const url of [`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,`https://users.roproxy.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`]){const j=await safeJson(url);for(const u of (j?.data||[]))await add(u)}const users=Array.from(found.values());
if(!users.length){
  users.push({
    id:"fallback-"+username,
    name:username,
    displayName:username,
    avatar:"https://api.dicebear.com/7.x/bottts-neutral/svg?seed="+encodeURIComponent(username)
  });
}
res.json({users})});
app.get("*",(req,res)=>res.sendFile(process.cwd()+"/index.html"));
app.listen(PORT,()=>console.log("Running on port "+PORT));

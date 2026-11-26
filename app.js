// 1) ใส่ Project URL และ anon/publishable key จาก Supabase
const SUPABASE_URL = "https://kugmgjtnqnjdediyhypd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WzrMjiRfywrZBRB820xgLA_jRk1NXIG";
const dbReady = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.includes("ใส่_");
const sb = dbReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const MEMBERS = ["กิต","เท็น","แบมโบ","ต้นปาล์ม","บ๊อบบี้","มาสเตอร์","ธรรมะ","จิมมี่","ปันปัน","สุดเขต","ออโต้","คิม","เจเจ","กานต์","นนท์","ภาส","คอปเตอร์","จิม","ตั้น","สตางค์","อาอิง","คณิน","เก็บตุน","โปรแกรม","ต้นน้ำ","ลิลลี่","กีวี่","น้ำอิง","หมิงหมิง","ใบข้าว","ลูกกอล์ฟ","แบมแบม","ติว","เซย่า","นีออน","ลิตเติ้ล","ครูสา","ครูผักกาด"];
let currentUser=null, currentMember=null, currentBuddy=null;
const $=id=>document.getElementById(id);
const emailFor=n=>`member${String(MEMBERS.indexOf(n)+1).padStart(2,"0")}@buddy.com`;
function toast(s){const t=$("toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function message(s){$("authMessage").textContent=s}
function fillMembers(){
  for(const id of ["signupName","loginName"]){$(id).innerHTML=MEMBERS.map((n,i)=>`<option value="${n}">${String(i+1).padStart(2,"0")} · ${n}</option>`).join("");}
  updateBuddyOptions();
}
async function updateBuddyOptions(){
  const me=$("signupName").value;
  if(!dbReady){$("signupBuddy").innerHTML='<option value="">ตั้งค่า Supabase ก่อน</option>';return}
  const {data,error}=await sb.rpc("available_buddies",{p_member_no:MEMBERS.indexOf(me)+1});
  if(error){$("signupBuddy").innerHTML='<option value="">โหลดรายชื่อไม่สำเร็จ</option>';return}
  $("signupBuddy").innerHTML='<option value="">เลือกบัดดี้</option>'+(data||[]).map(x=>`<option value="${x.member_no}">${String(x.member_no).padStart(2,"0")} · ${x.nickname}</option>`).join("");
}
function setTab(tab){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  $("signupForm").classList.toggle("hidden",tab!=="signup");$("loginForm").classList.toggle("hidden",tab!=="login");message("");
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
$("signupName").addEventListener("change",updateBuddyOptions);
$("signupForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!dbReady)return message("เว็บไซต์ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณาทำตาม README_TH.md");
  const name=$("signupName").value,buddy=Number($("signupBuddy").value),pw=$("signupPassword").value;
  if(pw!==$("signupConfirm").value)return message("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
  if(pw.length<8)return message("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  const memberNo=MEMBERS.indexOf(name)+1;
  const {data,error}=await sb.auth.signUp({email:emailFor(name),password:pw,options:{data:{member_no:memberNo,nickname:name}}});
  if(error)return message(error.message);
  if(!data.session){return message("สมัครบัญชีแล้ว แต่ต้องตั้งค่า Supabase ให้ปิด Email confirmation ก่อนใช้งาน")}
  const {error:lockError}=await sb.rpc("lock_buddy_choice",{p_member_no:memberNo,p_buddy_no:buddy});
  if(lockError){await sb.auth.signOut();return message(lockError.message+" กรุณาติดต่อผู้ดูแลระบบ")}
  currentUser=data.user;await loadApp();
});
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!dbReady)return message("เว็บไซต์ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณาทำตาม README_TH.md");
  const name=$("loginName").value,{data,error}=await sb.auth.signInWithPassword({email:emailFor(name),password:$("loginPassword").value});
  if(error)return message("ชื่อหรือรหัสผ่านไม่ถูกต้อง");
  currentUser=data.user;await loadApp();
});
$("logoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();currentUser=null;currentMember=null;$("appView").classList.add("hidden");$("authView").classList.remove("hidden")});
document.querySelectorAll(".menu-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
function showPage(p){document.querySelectorAll(".menu-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===p));document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$("page-"+p).classList.remove("hidden");if(p==="buddy")loadBuddy();if(p==="wishlist")loadMyWishlist();if(p==="mailbox")loadMailbox()}
async function loadApp(){
 const {data,error}=await sb.rpc("my_profile");
 if(error||!data?.length){message("ไม่พบข้อมูลสมาชิก กรุณาติดต่อผู้ดูแลระบบ");return}
 currentMember=data[0];$("welcomeName").textContent=currentMember.nickname;$("authView").classList.add("hidden");$("appView").classList.remove("hidden");await loadBuddy();await loadMyWishlist();
}
async function loadBuddy(){
 const {data,error}=await sb.rpc("my_buddy");
 if(error)return toast(error.message);if(!data?.length)return;
 currentBuddy=data[0];$("buddyName").textContent=currentBuddy.nickname;
 const {data:w,error:we}=await sb.rpc("buddy_wishlist");
 if(we)return $("buddyWishlist").innerHTML='<p class="muted">無法載入 Wishlist</p>';
 renderWishes($("buddyWishlist"),w||[],false);
}
function renderWishes(el,items,editable){
 if(!items.length){el.innerHTML='<p class="muted">ยังไม่มีรายการ Wishlist</p>';return}
 el.innerHTML=items.map(x=>`<article class="wish-item"><h4>🎁 ${esc(x.title)}</h4>${x.detail?`<p>${esc(x.detail)}</p>`:""}${x.url?`<a href="${safeUrl(x.url)}" target="_blank" rel="noopener">ดูลิงก์สินค้า ↗</a>`:""}${editable?`<div class="wish-actions"><button class="small-btn" data-del="${x.id}">ลบรายการ</button></div>`:""}</article>`).join("");
 if(editable)el.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>deleteWish(b.dataset.del)));
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function safeUrl(u){try{const x=new URL(u);return ["http:","https:"].includes(x.protocol)?esc(x.href):"#"}catch{return "#"}}
async function loadMyWishlist(){const {data,error}=await sb.from("wishlists").select("*").order("created_at",{ascending:false});if(error)return toast(error.message);renderWishes($("myWishlist"),data||[],true)}
$("wishForm").addEventListener("submit",async e=>{
 e.preventDefault();const item={user_id:currentUser.id,title:$("wishTitle").value.trim(),detail:$("wishDetail").value.trim(),url:$("wishUrl").value.trim()||null};
 const {error}=await sb.from("wishlists").insert(item);if(error)return toast(error.message);
 $("wishForm").reset();toast("เพิ่ม Wishlist แล้ว 🎁");loadMyWishlist();
});
async function deleteWish(id){const {error}=await sb.from("wishlists").delete().eq("id",id);if(error)return toast(error.message);loadMyWishlist();toast("ลบรายการแล้ว")}
$("clueForm").addEventListener("submit",async e=>{
 e.preventDefault();const {error}=await sb.from("clues").insert({sender_id:currentUser.id,recipient_no:currentBuddy.member_no,body:$("clueText").value.trim()});
 if(error)return toast(error.message);$("clueForm").reset();toast("ส่งคำใบ้แล้ว 💌");
});
async function loadMailbox(){const {data,error}=await sb.rpc("my_clues");if(error)return toast(error.message);const el=$("mailboxList");if(!data?.length){el.innerHTML='<p class="muted">ยังไม่มีคำใบ้เข้ามา รอเซอร์ไพรส์นะ 💌</p>';return}el.innerHTML=data.map(x=>`<article class="wish-item"><p>${esc(x.body)}</p><small class="muted">${new Date(x.created_at).toLocaleString("th-TH")}</small></article>`).join("")}
async function boot(){
 fillMembers();
 if(!dbReady){$("setupNotice").classList.remove("hidden");return}
 const {data}=await sb.auth.getSession();if(data.session){currentUser=data.session.user;await loadApp()}
}
boot();

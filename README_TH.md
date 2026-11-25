# Christmas Secret Buddy 2026 — คู่มือติดตั้งภาษาไทย

โปรเจกต์นี้เป็นเว็บต้นแบบพร้อมเชื่อมฐานข้อมูล Supabase และนำขึ้น GitHub Pages ได้
**ยังไม่มีลิงก์สาธารณะจนกว่าจะทำขั้นตอน Deploy และตั้งค่า Supabase เสร็จ**

## 1) สร้างฐานข้อมูล Supabase (ฟรี)
1. เข้า https://supabase.com/ แล้วสมัคร/เข้าสู่ระบบ
2. กด New project และตั้งชื่อ `christmas-secret-buddy`
3. ตั้งรหัสผ่านฐานข้อมูลและเลือก Region ที่ใกล้ประเทศไทย
4. รอสร้างโปรเจกต์เสร็จ
5. ไปที่ SQL Editor > New query
6. เปิดไฟล์ `supabase_setup.sql` คัดลอกทั้งหมดไปวาง แล้วกด Run
7. ไปที่ Project Settings > API (หรือ Data API) แล้วคัดลอก Project URL และ anon/public key
8. ไปที่ Authentication > Providers > Email แล้วปิด Confirm email เพื่อให้สมัครด้วยชื่อเล่นได้โดยไม่ต้องใช้อีเมลจริง
   - บัญชีจะใช้ email ภายในรูปแบบ member01@secretbuddy.invalid เป็นต้น
   - ผู้ใช้ต้องตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร

## 2) ใส่ค่าฐานข้อมูลในเว็บ
เปิด `app.js` แล้วแก้สองบรรทัดแรก:
```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```
ใช้เฉพาะ anon/public key เท่านั้น ห้ามใส่ service_role key ลงในเว็บหรือ GitHub เด็ดขาด

## 3) อัปโหลดขึ้น GitHub
1. เข้า https://github.com/ แล้วกด New repository
2. ตั้งชื่อ `christmas-secret-buddy` เลือก Public (หรือ Private หากจะตั้งค่า Pages ตามสิทธิ์บัญชี)
3. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ ได้แก่ `index.html`, `style.css`, `app.js`, `supabase_setup.sql`, `README_TH.md`
4. เข้า Settings > Pages
5. ใน Build and deployment เลือก Deploy from a branch
6. เลือก Branch `main` และ Folder `/ (root)` แล้วกด Save
7. รอ GitHub Pages เผยแพร่ เว็บจะได้ URL ลักษณะ `https://ชื่อผู้ใช้.github.io/christmas-secret-buddy/`

## 4) ทดสอบก่อนส่งลงกลุ่ม
- เปิดลิงก์ในหน้าต่างไม่ระบุตัวตน
- ทดลองสมัครด้วยสมาชิกทดสอบ 2 คนและบัดดี้ 2 คน
- ตรวจว่าเลือกบัดดี้ซ้ำไม่ได้
- ตรวจว่าแต่ละคนเห็น Wishlist ของบัดดี้ตัวเองเท่านั้น
- ตรวจว่าคำใบ้ไม่เปิดเผยชื่อผู้ส่ง
- เมื่อตรวจผ่านแล้วค่อยส่ง URL ให้เพื่อนทั้งห้อง

## ข้อควรรู้สำคัญเกี่ยวกับกติกา 38 คน
- หนึ่งชื่อสมัครได้ครั้งเดียว และเลือกบัดดี้ได้คนเดียว
- ชื่อบัดดี้ที่ถูกเลือกแล้วจะหายจากตัวเลือก
- ห้ามเลือกตัวเอง
- ระบบ SQL มีการตรวจเงื่อนไขเพื่อป้องกันการจับคู่ที่ทำให้คนสุดท้ายเหลือแต่ชื่อตัวเอง
- อย่าเปิดเผยรหัสผ่านของบัญชีใคร และอย่าใส่ service_role key ในไฟล์เว็บ

## หมายเหตุเรื่องการดูแลระบบ
โค้ดนี้เป็น starter project สำหรับกิจกรรมในห้องเรียน ควรให้ผู้ใหญ่/ครูช่วยตรวจการตั้งค่า Supabase และทดสอบสิทธิ์การเข้าถึงก่อนเปิดใช้งานจริง โดยเฉพาะการตั้งค่า Authentication และ Row Level Security

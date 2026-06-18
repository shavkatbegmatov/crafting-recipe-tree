# 🔁 Ish holati va davom ettirish (handoff)

> Boshqa kompyuterda (noutbukda) ishni davom ettirish uchun.
> **Sana:** 2026-06-18 · **Branch:** `feat/chat-reactions` · **Oxirgi PR:** [#24](https://github.com/shavkatbegmatov/crafting-recipe-tree/pull/24)
> **Production:** [erz-online.uz](https://erz-online.uz) · API: [api.erz-online.uz](https://api.erz-online.uz)

---

## 📍 Hozirgi holat

**Chat emoji reaksiyalar (reactions)** funksiyasi to'liq yozildi va sinaldi:

- Backend + frontend kod tayyor (commit `da1cc2c`)
- ✅ `mvn test` (exit 0), `vite build` (exit 0)
- ✅ **Jonli sinov** (lokal dev 8089): V24 migration qo'llandi → reaksiya INSERT → `GET /api/chat/messages` history'da to'g'ri guruhlandi (`emoji/count/users`, **LazyInit xatosi yo'q**) → DELETE → `reactions:[]` → test ma'lumot tozalandi
- ✅ **PR #24 OCHIQ, CI YASHIL** — Backend CI pass (37s), Frontend CI pass (26s); holat `MERGEABLE` / `CLEAN`
- ⏳ **Hali merge QILINMAGAN va deploy bo'lmagan** — buni noutbukda davom ettiramiz

Bu "professional chat funksiyalari" to'plamining **oxirgi qismi**. Avvalgilari (reply / edit / o'z xabarini o'chirish / "yozmoqda" indikatori) [PR #23](https://github.com/shavkatbegmatov/crafting-recipe-tree/pull/23) da yetkazilgan va production'da ishlaydi.

---

## ✅ Darhol qilinadigan ishlar (noutbukda, shu tartibda)

### 1. Repo'ni yangilash
```bash
git fetch origin
git checkout feat/chat-reactions
git pull
```

### 2. PR #24'ni merge qilish (CI allaqachon yashil)
```bash
gh pr merge 24 --squash --delete-branch
git checkout main && git pull
```
Merge'dan keyin GitHub Actions avtomatik ishga tushadi: Docker image build → GHCR push → Coolify webhook → deploy.

### 3. Deploy tugashini kutib, production'ni tekshirish (~2–4 daqiqa)
```bash
curl -s https://api.erz-online.uz/actuator/health
# Kutilgan: {"status":"UP"}

curl -s "https://api.erz-online.uz/api/chat/messages?limit=3"
# Kutilgan: har bir xabarda "reactions": [] (yoki to'ldirilgan) maydoni bo'lishi kerak — V24 boot OK belgisi
```

### 4. Brauzerда jonli sinash
`Ctrl + Shift + R` (hard refresh) → chatni oching:
- Xabar ustiga sichqonchani olib boring → 😀 (**SmilePlus**) tugmasi chiqadi → bosing → emoji picker (👍 ❤️ 😂 😮 😢 🎉) → emoji tanlang
- Bubble ostida reaksiya chipi paydo bo'ladi; **"men bosgan"** oltin rangda ajralib turadi
- Chipni qayta bosing → reaksiya olib tashlanadi (**toggle**)
- Ikkinchi brauzer / akkaunt bilan **real-time** tarqalishini ko'ring

### 5. (Merge'dan keyin) HANDOFF.md'ni o'chirish
```bash
git rm HANDOFF.md && git commit -m "chore: handoff hujjatini olib tashlash" && git push
```

---

## 🧱 Loyiha haqida qisqa

- **Backend**: Spring Boot 3.4.4, Java 17, Hibernate 6.6, Flyway (V1–**V24**), Spring Security (JWT, RoleHierarchy SUPER_ADMIN>ADMIN>USER), STOMP WebSocket, Actuator, Caffeine cache, Micrometer/Prometheus, Testcontainers
- **Frontend**: React 18 + TypeScript + Vite 5, TanStack Query, react-i18next (4 til: `uz`, `uz-cyr`, `ru`, `en`), Tailwind (dark theme), framer-motion, @stomp/stompjs
- **CI/CD**: GitHub Actions → GHCR Docker images → Coolify webhook. PR'lar `--squash --delete-branch` bilan merge qilinadi.

### Reactions o'zgartirgan/qo'shgan fayllar (PR #24)
**Backend** — `V24__chat_reactions.sql`, `ChatMessageReaction` (entity), `ChatMessageReactionRepository`, `ReactionGroupDto`, `ChatReactionRequest`, `ChatReactionUpdate`, hamda `ChatMessage` / `ChatMessageDto` / `ChatController` / `ChatMessageRepository` (tahrir).
**Frontend** — `api/chat.ts` (`ReactionGroup`), `hooks/useChat.ts` (`react()` + `/topic/chat.reaction`), `components/chat/ChatPanel.tsx` (picker + chiplar), 4 ta i18n fayl (`chat.react`).

---

## ⚙️ Operatsion eslatmalar (MUHIM)

### Lokal dev runtime
Backend dev profil **port 8089** + lokal PostgreSQL bilan jonli sinaladi:
```bash
mvn -f backend/pom.xml --% -q -Daether.connector.https.securityMode=insecure spring-boot:run -Dspring-boot.run.profiles=dev
```
Frontend dev:
```bash
npm --prefix frontend run dev
```
> ⚠️ **Noutbukda PostgreSQL ulanishini moslang.** Bu PC'da `application-dev.yml` lokal `crafting_recipe_db` bazasiga (`crafting_recipe_user`) ulanadi. Noutbukda baza/parol boshqacha bo'lishi mumkin — `backend/src/main/resources/application-dev.yml`ni tekshiring va kerak bo'lsa lokal PostgreSQL'ni o'rnating.

### Maven SSL (faqat bu PC'da kerak edi)
PowerShell'da `-D` argumentlar uchun `mvn --%` (stop-parsing) + `-Daether.connector.https.securityMode=insecure`. Noutbukda SSL/PKIX muammosi bo'lmasa, bu bayroqlar shart emas — oddiy `mvn test` ishlaydi.

### Xavfsizlik / ma'lumotlar
- 🔒 **Production `JWT_SECRET` Coolify'da o'rnatilgan — HECH QACHON o'zgartirmang** (barcha foydalanuvchi sessiyalari bekor bo'ladi).
- Production'da `DB_PASSWORD` / `JWT_SECRET` default'siz, faqat env'dan keladi.
- 🧹 **Test ma'lumotlarini HAR DOIM tozalang** (sinov uchun yaratilgan user / xabar / reaksiya).
- `admin` foydalanuvchisi — **SUPER_ADMIN**.

### Test tezkor buyruqlari
```bash
mvn -f backend/pom.xml --% -q -Daether.connector.https.securityMode=insecure test   # backend (Docker yo'q bo'lsa smoke testlar skip — normal)
npm --prefix frontend run build                                                      # frontend: tsc -b && vite build
```

---

## 💡 Kelajak g'oyalar (hali rejada yo'q, ixtiyoriy)

Chatni yanada professional qilish:
- 🖼 Rasm / fayl ulash (image upload)
- 🔔 `@mention` (foydalanuvchini eslatish) + bildirishnoma
- 🔍 Chat ichida xabar qidirish
- ♾ Tarixni infinite-scroll bilan yuklash (hozir oxirgi 50 ta)
- 📌 Xabarni "pin" qilish
- 😀 Picker'ga ko'proq emoji / emoji qidirish

Boshqa:
- CI'da Testcontainers uchun Docker (hozir Docker bo'lmasa smoke testlar skip)
- E2E testlar (Playwright)

---

*Tayyorladi: Claude Code. Noutbukda davom etganda — shu hujjatni Claude'ga ko'rsating, kontekst tiklanadi.*

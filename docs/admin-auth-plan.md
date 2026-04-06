# Admin Authentication + Recipe Editing

## Arxitektura
```
Frontend: Login sahifa → POST /api/auth/login → JWT token
  → Token localStorage'da saqlanadi
  → Authorization: Bearer <token> header (axios interceptor)
  → Admin role: edit/upload tugmalar ko'rinadi
Backend: Spring Security + JWT filter chain
  → GET /api/** — permitAll (hamma ko'rishi mumkin)
  → PUT/POST /api/items/** — ADMIN role kerak
```

## Default admin
- Username: `admin`
- Password: `admin123`

## Endpointlar
| Method | URL | Ruxsat |
|--------|-----|--------|
| POST | /api/auth/login | Hamma |
| GET | /api/auth/me | Token bilan |
| GET | /api/** | Hamma |
| PUT | /api/items/{id} | ADMIN |
| POST | /api/items/{id}/upload-image | ADMIN |

## Frontend
- `/login` — login sahifa
- Header'da: Kirish/Chiqish tugma + Admin badge
- ItemDetailPage: admin uchun "Tahrirlash" tugmasi
- Edit mode: 4 tilda nom va tavsif input'lari (8 ta field)
- Saqlash/Bekor qilish tugmalari

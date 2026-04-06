# Internationalization (i18n) — 4 til: UZ, UZ-кир, RU, EN

## Arxitektura
- **Frontend**: `react-i18next` — 4 ta JSON tarjima fayli + `useTranslation()` hook
- **Backend**: Barcha til maydonlari DTO'da qaytariladi, frontend `useLocalizedField()` hook orqali tanlaydi
- **DB**: `craft_items` da `name_uz`, `name_en`, `name_uz_cyr`, `description_uz`, `description_en`, `description_uz_cyr` ustunlari
- **Til tanlash**: Header'da tugmalar (UZ / УЗ / RU / EN), localStorage'da saqlanadi

## Tillar
| Kod | Label | Nomi |
|-----|-------|------|
| uz | UZ | O'zbekcha (lotin) |
| uz-cyr | УЗ | Ўзбекча (kirill) |
| ru | RU | Русский |
| en | EN | English |

## Fayllar
- `frontend/src/i18n/index.ts` — i18n konfiguratsiya
- `frontend/src/i18n/locales/uz.json` — ~50 UI string
- `frontend/src/i18n/locales/uz-cyr.json`
- `frontend/src/i18n/locales/ru.json`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/hooks/useLanguage.ts` — `useLocalizedField()` hook
- `backend/src/main/resources/db/migration/V5__add_i18n_columns.sql`
- `backend/src/main/resources/db/migration/V6__populate_i18n_data.sql`

## API javob formati
```json
{
  "name": "Мотор",
  "nameUz": "Motor",
  "nameEn": "Motor",
  "nameUzCyr": "Мотор",
  "description": "Электрический мотор",
  "descriptionUz": "Elektr motori",
  "descriptionEn": "Electric motor",
  "descriptionUzCyr": "Электр мотори"
}
```

## useLocalizedField() hook
```typescript
const { getField } = useLocalizedField()
getField(item, 'name')        // tilga qarab to'g'ri maydonni qaytaradi
getField(item, 'description') // ...
```

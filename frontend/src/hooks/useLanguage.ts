import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

const SUFFIX_MAP: Record<string, string> = {
  ru: '',
  uz: 'Uz',
  en: 'En',
  'uz-cyr': 'UzCyr',
}

/**
 * Hook to get localized field from API response objects.
 *
 * API returns: name (RU), nameUz, nameEn, nameUzCyr
 * This hook picks the right one based on current language.
 *
 * Usage: const { getField } = useLocalizedField()
 *        getField(item, 'name')        → item.name / item.nameUz / item.nameEn / item.nameUzCyr
 *        getField(item, 'description') → item.description / item.descriptionUz / ...
 *        getField(category, 'categoryName') → item.categoryNameRu / item.categoryNameUz / ...
 */
export function useLocalizedField() {
  const { i18n } = useTranslation()

  const getField = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj: any, baseField: string): string => {
      if (!obj) return ''
      const lang = i18n.language
      const suffix = SUFFIX_MAP[lang]

      if (suffix === undefined) {
        // Unknown language, fallback to base
        return obj[baseField] || ''
      }

      if (suffix === '') {
        // Russian: try baseField directly (e.g., 'name', 'description')
        // But for category names, try baseField + 'Ru' first
        const ruField = baseField + 'Ru'
        return obj[ruField] || obj[baseField] || ''
      }

      // Other languages: try baseField + suffix, fallback to base
      const localizedField = baseField + suffix
      return obj[localizedField] || obj[baseField] || ''
    },
    [i18n.language]
  )

  return { getField }
}

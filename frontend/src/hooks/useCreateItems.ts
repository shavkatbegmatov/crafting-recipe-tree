import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createItem,
  createItemsBulk,
  deleteItems,
  type CreateItemData,
  type BulkCreateResult,
  type DeleteItemsResult,
} from '../api/items'
import { useGameVersion } from '../contexts/GameVersionContext'

/** Yaratishdan keyin item ro'yxati va statistika eskiradi. */
function invalidateItemData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['items'] })
  qc.invalidateQueries({ queryKey: ['search'] })
  qc.invalidateQueries({ queryKey: ['gameVersions'] })
  qc.invalidateQueries({ queryKey: ['adminStats'] })
}

export function useCreateItem() {
  const qc = useQueryClient()
  const { effectiveVersion } = useGameVersion()
  return useMutation({
    mutationFn: (data: CreateItemData) => createItem(data, effectiveVersion ?? undefined),
    onSuccess: () => invalidateItemData(qc),
  })
}

export function useCreateItemsBulk() {
  const qc = useQueryClient()
  const { effectiveVersion } = useGameVersion()
  return useMutation<
    BulkCreateResult,
    unknown,
    { items: CreateItemData[]; defaultCategoryCode?: string; dryRun: boolean }
  >({
    mutationFn: ({ items, defaultCategoryCode, dryRun }) =>
      createItemsBulk(items, defaultCategoryCode, dryRun, effectiveVersion ?? undefined),
    // dryRun bazaga tegmaydi, shuning uchun keshni faqat haqiqiy qo'shishda tozalaymiz.
    onSuccess: (res) => {
      if (!res.dryRun) invalidateItemData(qc)
    },
  })
}

export function useDeleteItems() {
  const qc = useQueryClient()
  const { effectiveVersion } = useGameVersion()
  return useMutation<DeleteItemsResult, unknown, { itemIds: number[]; dryRun: boolean }>({
    mutationFn: ({ itemIds, dryRun }) =>
      deleteItems(itemIds, dryRun, effectiveVersion ?? undefined),
    // dryRun bazaga tegmaydi — keshni faqat haqiqiy o'chirishda tozalaymiz.
    onSuccess: (res) => {
      if (!res.dryRun) invalidateItemData(qc)
    },
  })
}

import client from './client'
import type { GameVersion } from './types'

export async function fetchGameVersions(): Promise<GameVersion[]> {
  const { data } = await client.get('/game-versions')
  return data
}

export async function fetchCurrentGameVersion(): Promise<GameVersion> {
  const { data } = await client.get('/game-versions/current')
  return data
}

export interface CreateGameVersionData {
  version: string
  releasedAt?: string
  notes?: string | null
  makeCurrent?: boolean
}

export async function createGameVersion(data: CreateGameVersionData): Promise<GameVersion> {
  const { data: res } = await client.post('/game-versions', data)
  return res
}

export interface UpdateGameVersionData {
  version?: string
  releasedAt?: string
  notes?: string | null
}

export async function updateGameVersion(id: number, data: UpdateGameVersionData): Promise<GameVersion> {
  const { data: res } = await client.patch(`/game-versions/${id}`, data)
  return res
}

export async function setCurrentGameVersion(id: number): Promise<GameVersion> {
  const { data } = await client.post(`/game-versions/${id}/set-current`)
  return data
}

export async function deleteGameVersion(id: number): Promise<void> {
  await client.delete(`/game-versions/${id}`)
}

export interface VersionStats {
  versionId: number
  version: string
  isCurrent: boolean
  itemCount: number
  recipeCount: number
}

export async function fetchGameVersionStats(): Promise<VersionStats[]> {
  const { data } = await client.get('/game-versions/stats')
  return data
}

export interface CopyFromVersionData {
  sourceVersionId: number
  /** Bo'sh bo'lsa — manba versiyaning hamma itemi. */
  itemIds?: number[]
  withRecipes?: boolean
}

export interface VersionCopyResult {
  sourceVersion: string
  targetVersion: string
  itemsCopied: number
  itemsSkipped: number
  recipesCopied: number
  recipesSkipped: number
  warnings: string[]
}

export async function copyFromVersion(targetId: number, data: CopyFromVersionData): Promise<VersionCopyResult> {
  const { data: res } = await client.post(`/game-versions/${targetId}/copy-from`, data)
  return res
}

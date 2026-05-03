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

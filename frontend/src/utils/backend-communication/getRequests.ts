import type { IBackendEntity, IBackendEntityPreview } from '@/types/backendTypes'
import { backendUrl } from '@/utils/config/config'

export const getAllEntities: () => Promise<IBackendEntityPreview[]> = async () => {
  return fetch(backendUrl + '/api/entity/getAll').then((res) => res.json())
}

export const getAllEntitiesInFactory: (factoryId: number) => Promise<IBackendEntity[]> = async (factoryId: number) => {
  return fetch(backendUrl + '/api/factory/getAll/' + factoryId).then((res) => res.json())
}

export const getEntityInFactory: (entityId: number) => Promise<IBackendEntity> = async (entityId: number) => {
  return fetch(backendUrl + '/api/entity/get/' + entityId, {credentials: "include"}).then((res) => res.json())
}

export const getAllFactories = async () => {
  return fetch(backendUrl + '/api/factory/getAll').then((res) => res.json())
}

export const getFactoryImage: (factoryId: number) => Promise<String> = async (factoryId: number) => {
  return fetch(backendUrl + '/api/factory/getImage/' + factoryId).then((res) => res.text())
}
export const getAllUsers: () => Promise<{ username: string }[]> = async () => {
  return fetch(backendUrl + '/api/users/getAll').then((res) => res.json())
}


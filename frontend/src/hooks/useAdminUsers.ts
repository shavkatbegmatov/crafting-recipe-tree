import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchUsers,
  fetchUserStats,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  type UserListParams,
  type UserRole,
} from '../api/users'

export function useAdminUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => fetchUsers(params),
    staleTime: 5_000,
  })
}

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
    staleTime: 5_000,
  })
}

/** Foydalanuvchi ro'yxati va statistikani qayta yuklash uchun yagona invalidatsiya nuqtasi. */
function useInvalidateUsers() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['adminUsers'] })
    qc.invalidateQueries({ queryKey: ['userStats'] })
  }
}

export function useUpdateUserRole() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => updateUserRole(id, role),
    onSuccess: invalidate,
  })
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => updateUserStatus(id, enabled),
    onSuccess: invalidate,
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword?: string }) =>
      resetUserPassword(id, newPassword),
  })
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: invalidate,
  })
}

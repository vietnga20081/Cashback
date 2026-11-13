import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/api';
import { useAuthStore } from '../stores/auth.store';

/**
 * Fetches full profile from API and syncs referralCode + avatar into Zustand store.
 * Call once in DashboardLayout so referralCode is always populated.
 */
export function useProfile() {
  const { isAuthenticated, updateUser } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      updateUser({
        fullName:     data.fullName,
        avatar:       data.avatar,
        referralCode: data.referralCode,
      });
    }
  }, [data, updateUser]);

  return data;
}

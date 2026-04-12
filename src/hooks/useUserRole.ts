import { useState, useEffect } from 'react';
import { getAuthToken, onAuthChanged } from '@/lib/auth';

type AuthUser = {
  id: string;
  email: string;
};

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const syncUserRole = () => {
      setIsLoading(true);

      if (getAuthToken()) {
        setRole('moderator');
        setUser({ id: 'azure-user', email: 'moderator@truckerwatch.com' });
      } else {
        setRole(null);
        setUser(null);
      }

      setIsLoading(false);
    };

    syncUserRole();
    const unsubscribe = onAuthChanged(syncUserRole);

    return () => {
      unsubscribe();
    };
  }, []);

  const isModerator = role === 'moderator' || role === 'admin';

  return { role, isModerator, user, isLoading };
};

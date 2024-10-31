import { useEffect, useState } from 'react';

import { Record } from '@/lib/types';

const useAuth = () => {
  const [user, setUser] = useState<Record | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setUser({
        firstName: 'John',
        lastName: 'Doe',
      });
    }, 2000);
  });
  return {
    user,
  };
};

export default useAuth;

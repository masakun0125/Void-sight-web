import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Index() {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated')   router.push('/dashboard');
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);
  return null;
}

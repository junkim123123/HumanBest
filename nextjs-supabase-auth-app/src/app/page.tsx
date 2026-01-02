import React from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../components/AuthProvider';

const HomePage = () => {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to the login page if not authenticated
    const isAuthenticated = false; // Replace with actual authentication check
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <AuthProvider>
      <div>
        <h1>Welcome to the NexSupply App</h1>
        <p>Please log in to continue.</p>
      </div>
    </AuthProvider>
  );
};

export default HomePage;
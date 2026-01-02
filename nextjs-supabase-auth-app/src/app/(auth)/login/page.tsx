import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import EmailPasswordForm from '../../../components/EmailPasswordForm';
import GoogleSignInButton from '../../../components/GoogleSignInButton';
import ForgotPasswordForm from './ForgotPasswordForm';

const LoginPage = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {!isForgotPassword ? (
        <>
          <EmailPasswordForm onSuccess={handleLoginSuccess} />
          <GoogleSignInButton onSuccess={handleLoginSuccess} />
          <button
            className="mt-4 text-blue-500"
            onClick={() => setIsForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </>
      ) : (
        <ForgotPasswordForm onBack={() => setIsForgotPassword(false)} />
      )}
    </div>
  );
};

export default LoginPage;
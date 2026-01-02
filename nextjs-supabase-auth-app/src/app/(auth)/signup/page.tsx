import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import EmailPasswordForm from '../../../components/EmailPasswordForm';

const SignupPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (email, password) => {
    setLoading(true);
    setError(null);

    const { user, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Handle successful signup (e.g., redirect to dashboard or show success message)
      console.log('User signed up:', user);
    }

    setLoading(false);
  };

  return (
    <div className="signup-container">
      <h1>Sign Up</h1>
      {error && <p className="error">{error}</p>}
      <EmailPasswordForm
        onSubmit={handleSignup}
        loading={loading}
        buttonText="Create Account"
      />
    </div>
  );
};

export default SignupPage;
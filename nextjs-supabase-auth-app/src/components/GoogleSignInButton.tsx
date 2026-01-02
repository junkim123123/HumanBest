import { signIn } from '@supabase/auth-helpers-react';
import { Button } from '@mui/material';

const GoogleSignInButton = () => {
  const handleGoogleSignIn = async () => {
    const { error } = await signIn({ provider: 'google' });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={handleGoogleSignIn}>
      Continue with Google
    </Button>
  );
};

export default GoogleSignInButton;
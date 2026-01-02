import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the password reset link!');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <h2 className="text-lg font-semibold">Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className={`bg-blue-500 text-white p-2 rounded ${loading ? 'opacity-50' : ''}`}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      {message && <p className="text-red-500">{message}</p>}
    </form>
  );
};

export default ForgotPasswordForm;
# Next.js Supabase Authentication App

This project is a Next.js application that implements authentication using Supabase. It supports email/password login, Google OAuth, and includes a "Forgot Password" flow.

## Features

- **Email/Password Login**: Users can log in using their email and password.
- **Google OAuth**: Users can authenticate using their Google account.
- **Forgot Password**: Users can request a password reset email.
- **Sign Up**: New users can create an account using their email and password.
- **Dashboard**: A protected dashboard that users can access after successful authentication.

## Project Structure

```
nextjs-supabase-auth-app
├── src
│   ├── app
│   │   ├── (auth)
│   │   │   ├── login
│   │   │   │   ├── page.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── reset-password
│   │   │   │   └── page.tsx
│   │   │   └── signup
│   │   │       └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── AuthProvider.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   ├── EmailPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   └── lib
│       └── supabaseClient.ts
├── supabase
│   └── schema.sql
├── public
│   └── favicon.svg
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd nextjs-supabase-auth-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a Supabase project.
   - Configure authentication settings and database schema as defined in `supabase/schema.sql`.

4. **Run the application**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000/auth/login`.

## Manual Test Steps

1. Start the Next.js application using `npm run dev`.
2. Navigate to `http://localhost:3000/auth/login`.
3. Test the email/password login by entering valid credentials and clicking the submit button.
4. Test the "Continue with Google" button to ensure it redirects to the Google authentication flow.
5. Click on the "Forgot Password" link and enter an email to test the password reset email functionality.
6. Navigate to `http://localhost:3000/auth/reset-password` and verify that the reset password page works as expected.
7. Navigate to `http://localhost:3000/auth/signup` and test the sign-up process with valid email and password.
8. After signing in, verify that you are redirected to the dashboard at `http://localhost:3000/dashboard`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
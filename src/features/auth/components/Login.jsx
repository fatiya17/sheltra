"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';

const Login = () => {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/safe-route';
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // validasi form login
  const validate = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Silakan masukkan nama atau email.';
    }
    if (!password.trim()) {
      newErrors.password = 'Silakan masukkan kata sandi.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // submit login form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    login(
      {
        name: identifier.trim() ? identifier.trim().split('@')[0] : 'Fatiya Khairina',
        email: identifier.includes('@') ? identifier.trim() : 'fatiya.khairina@sheltra.id',
      },
      redirectPath
    );
  };

  // social login handler
  const handleSocialLogin = (provider) => {
    login(
      {
        name: 'Fatiya Khairina',
        email: 'fatiya.khairina@sheltra.id',
      },
      redirectPath
    );
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>
      <p className="auth-subtitle">Login your account</p>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="form-group">
          <Input
            type="text"
            placeholder="Name or Email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
            }}
            aria-invalid={!!errors.identifier}
          />
          {errors.identifier && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.identifier}</p>
          )}
        </div>
        <div className="form-group">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.password}</p>
          )}
        </div>
        <div className="form-actions-row">
          <div className="remember-me">
            <input
              type="checkbox"
              id="remember-me"
              className="remember-me-checkbox"
            />
            <label htmlFor="remember-me" className="remember-me-label">
              Remember me
            </label>
          </div>
          <Link href="/sign-up" className="forgot-link">
            Forget Password?
          </Link>
        </div>
        <Button type="submit" variant="primary" className="w-full font-medium">
          Login
        </Button>
      </form>
      <p className="social-text">Or continue with social account</p>
      <div className="social-login">
        <button type="button" className="social-btn google" onClick={() => handleSocialLogin('Google')}>
          <svg className="social-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
        <button type="button" className="social-btn apple" onClick={() => handleSocialLogin('Apple')}>
          <img
            src="https://cdn.brandfetch.io/idnrCPuv87/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B"
            alt="Apple"
            className="social-icon"
          />
          Apple
        </button>
      </div>
      <div className="no-account">
        <span className="no-account-text">Don't have an account? </span>
        <Link href="/sign-up" className="login-link">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;
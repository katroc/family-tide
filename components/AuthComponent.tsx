import React, { useState } from 'react';
import { authLogger } from '../utils/logger';
import { supabaseService } from '../supabaseService';
import { authService } from '../services/authService';

interface AuthComponentProps {
  onAuthSuccess: (isSetupComplete: boolean) => Promise<void>;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await supabaseService.signUp(email, password);
        if (!result.success) {
          throw new Error(result.error || 'Sign up failed');
        }
        await onAuthSuccess(false);
      } else {
        const result = await supabaseService.signIn(email, password);
        if (!result.success) {
          throw new Error(result.error || 'Sign in failed');
        }
        const isSetupComplete = await authService.isSetupComplete();
        await onAuthSuccess(isSetupComplete);
      }
    } catch (err: any) {
      authLogger.error('❌ Authentication error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#A8D8D8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/familytide.png" 
            alt="Family Tide" 
            className="w-52 h-52 object-contain"
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-slate-600"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-slate-600"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-slate-600"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading 
                    ? 'bg-teal-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-teal-600 hover:text-teal-500"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Sign up'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
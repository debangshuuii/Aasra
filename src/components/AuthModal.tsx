import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, displayName, signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        // Give a user-friendly message for common OAuth redirect errors
        const msg = error.message || '';
        if (
          msg.toLowerCase().includes('redirect') ||
          msg.toLowerCase().includes('provider') ||
          msg.toLowerCase().includes('oauth') ||
          msg.toLowerCase().includes('origin')
        ) {
          setErrorMessage(
            'Google sign-in could not be completed. If you are on localhost, please ensure this URL is added as an Authorized Redirect URI in your Supabase project and Google Cloud Console. Alternatively, use the email magic link below.'
          );
        } else {
          setErrorMessage(msg || 'Failed to sign in with Google. Please try the magic link option below.');
        }
        setIsGoogleLoading(false);
      }
      // If no error, Google will redirect — keep loading spinner
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setIsSendingMagicLink(true);

    try {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) {
        setErrorMessage(error.message || 'Failed to send magic link. Please verify your email.');
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-display">
            {user ? `Welcome back, ${displayName || user.email?.split('@')[0] || 'User'}` : 'Welcome to Aasra'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            {user
              ? 'Your account is securely linked. All screenings and daily check-ins sync automatically.'
              : 'Sign in securely to preserve your trauma screenings, track daily moods, and protect your recovery journey.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            or passwordless email
          </span>
        </div>

        {/* Email Magic Link Section */}
        {magicLinkSent ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-950">Magic Link Dispatched!</h3>
            <p className="text-xs text-emerald-800 mt-1">
              We sent a secure login link to <strong className="font-semibold">{email}</strong>.
            </p>
            <p className="text-[11px] text-emerald-700 mt-2">
              Click the link in your email to sign in instantly without any password.
            </p>
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
              }}
              className="mt-3 text-xs font-semibold text-emerald-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-gray-700 mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 rounded-xl text-sm text-gray-900 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingMagicLink || !email}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSendingMagicLink ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Magic Link...</span>
                </>
              ) : (
                <span>Send Magic Sign-In Link</span>
              )}
            </button>
          </form>
        )}

        {/* Guest Session Bypass Option */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-200 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-gray-500" />
            <span>Continue as Guest (Private In-Browser Mode)</span>
          </button>
        </div>

        {/* Medical Privacy & Confidentiality Guarantee */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2.5 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            Strict clinical confidentiality: Your assessments and PIN-locked records are isolated with Row Level Security.
          </span>
        </div>
      </div>
    </div>
  );
};

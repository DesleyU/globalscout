import { useState } from 'react';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User, ChevronRight,
  Shield, Users, Search, Trophy, CheckCircle2, Sparkles, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import logoImage from '../../imports/image0-1.png';

type AuthScreen = 'sign-in' | 'create-account' | 'forgot-password';

interface AuthFlowProps {
  initialScreen?: AuthScreen;
  onSignIn: (role: 'player' | 'scout') => void;    // returning user → dashboard
  onCreateAccount: () => void;                       // new user → onboarding
  onExit: () => void;
}

export default function AuthFlow({
  initialScreen = 'sign-in',
  onSignIn,
  onCreateAccount,
  onExit,
}: AuthFlowProps) {
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <img src={logoImage} alt="GlobalScout" className="h-8 w-auto brightness-0 invert" />
        </button>
        <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          {screen === 'sign-in' && (
            <SignInScreen
              onSuccess={onSignIn}
              onCreateAccount={() => setScreen('create-account')}
              onForgotPassword={() => setScreen('forgot-password')}
            />
          )}
          {screen === 'create-account' && (
            <CreateAccountScreen
              onSuccess={onCreateAccount}
              onSignIn={() => setScreen('sign-in')}
            />
          )}
          {screen === 'forgot-password' && (
            <ForgotPasswordScreen onBack={() => setScreen('sign-in')} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sign In ────────────────────────────────────────────────────────────────

function SignInScreen({
  onSuccess,
  onCreateAccount,
  onForgotPassword,
}: {
  onSuccess: (role: 'player' | 'scout') => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    // Simulate auth — scout demo account, player otherwise
    setTimeout(() => {
      setLoading(false);
      const role = email.toLowerCase().includes('scout') ? 'scout' : 'player';
      onSuccess(role);
    }, 1200);
  };

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Left – branding */}
      <div className="hidden md:block">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          Welcome back
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Sign in to your<br />GlobalScout account
        </h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          Connect with scouts, showcase your career, and unlock opportunities worldwide.
        </p>
        <div className="space-y-4">
          {[
            { icon: Users, text: '50,000+ active players' },
            { icon: Search, text: '2,500+ professional scouts' },
            { icon: Trophy, text: '800+ clubs worldwide' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right – form */}
      <div>
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
              <p className="text-gray-500 text-sm">
                New to GlobalScout?{' '}
                <button onClick={onCreateAccount} className="text-blue-600 hover:underline font-medium">
                  Create an account
                </button>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-400">or continue with</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialButton label="Google" icon="G" />
              <SocialButton label="Apple" icon="⌘" />
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              By signing in you agree to our{' '}
              <a href="#" className="underline hover:text-gray-600">Terms</a> and{' '}
              <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
            </p>

            {/* Demo hint */}
            <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">Demo accounts</p>
              <p className="text-xs text-blue-600">
                Any email → Player dashboard<br />
                Email containing "scout" → Scout dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Create Account ──────────────────────────────────────────────────────────

function CreateAccountScreen({
  onSuccess,
  onSignIn,
}: {
  onSuccess: () => void;
  onSignIn: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' };
    if (pw.length < 10) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = passwordStrength(form.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Left – branding */}
      <div className="hidden md:block">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          Free to join
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Start your football<br />journey today
        </h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          Create a free account and connect your football identity to get discovered by scouts worldwide.
        </p>
        <div className="space-y-3">
          {[
            'Free profile for players',
            'Connect your official statistics',
            'Visible to 2,500+ professional scouts',
            'Direct messaging with clubs',
          ].map(text => (
            <div key={text} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right – form */}
      <div>
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button onClick={onSignIn} className="text-blue-600 hover:underline font-medium">
                  Sign in
                </button>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="John Smith"
                    value={form.name}
                    onChange={set('name')}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    className={`pl-10 ${form.confirm && form.confirm !== form.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                    autoComplete="new-password"
                  />
                  {form.confirm && form.confirm === form.password && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-400">or continue with</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialButton label="Google" icon="G" />
              <SocialButton label="Apple" icon="⌘" />
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              By creating an account you agree to our{' '}
              <a href="#" className="underline hover:text-gray-600">Terms</a> and{' '}
              <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="border-0 shadow-2xl bg-white w-full max-w-md">
        <CardContent className="p-8">
          {!sent ? (
            <>
              <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>

              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset password</h2>
              <p className="text-gray-500 text-sm mb-7">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={!email}>
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-8">
                We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
              </p>
              <Button variant="outline" className="w-full" onClick={onBack}>
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────

function SocialButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="flex items-center justify-center gap-2.5 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition w-full">
      <span className="font-bold text-base leading-none">{icon}</span>
      {label}
    </button>
  );
}

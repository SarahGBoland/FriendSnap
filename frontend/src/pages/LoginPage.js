import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_share-memories-1/artifacts/0pgxf50e_ChatGPT%20Image%20Jan%2014%2C%202026%2C%2008_18_46%20PM.png";

// Text-to-speech helper
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim() || !password.trim()) {
      toast.error('Please fill in all fields!');
      return;
    }

    setLoading(true);
    try {
      await login(nickname, password);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (error) {
      const message = error.response?.data?.detail || 'Wrong nickname or password. Try again!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="login-page">
      <div className="app-container max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 py-2"
          aria-label="Go back"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          <span className="font-semibold text-lg">Back</span>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={LOGO_URL} alt="FriendSnap" className="h-24 w-auto" />
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm animate-fade-in-up" data-testid="login-form">
          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Welcome Back!
            </h1>
            <button
              onClick={() => speak('Welcome back! Enter your nickname and password to continue.')}
              className="tts-button"
              aria-label="Read instructions"
              data-testid="tts-login"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <p className="text-slate-600 text-lg mb-6">
            Enter your nickname and password.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block font-semibold text-slate-700 mb-2 text-lg">
                Your Nickname
              </label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Type your nickname"
                className="h-14 rounded-2xl border-2 text-lg px-4"
                data-testid="login-nickname-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-semibold text-slate-700 mb-2 text-lg">
                Your Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password"
                className="h-14 rounded-2xl border-2 text-lg px-4"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-8 py-6 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg btn-press disabled:opacity-50 mt-6"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="spinner w-6 h-6 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-2" strokeWidth={2.5} />
                  <span>Log In</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-lg">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-orange-500 font-bold hover:underline"
                data-testid="go-to-signup"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

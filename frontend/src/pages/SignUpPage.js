import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
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

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await axios.get(`${API}/avatars`);
      setAvatars(response.data);
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
    }
  };

  const handleStep1Continue = () => {
    if (!nickname.trim()) {
      toast.error('Please choose a nickname!');
      return;
    }
    if (nickname.length < 3) {
      toast.error('Nickname must be at least 3 letters');
      return;
    }
    if (!password.trim()) {
      toast.error('Please choose a password!');
      return;
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setStep(2);
  };

  const handleSignUp = async () => {
    if (!selectedAvatar) {
      toast.error('Please pick an avatar!');
      return;
    }

    setLoading(true);
    try {
      await register(nickname, password, selectedAvatar.url);
      toast.success('Welcome to FriendSnap!');
      navigate('/home');
    } catch (error) {
      const message = error.response?.data?.detail || 'Something went wrong. Try again!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="signup-page">
      <div className="app-container max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => step === 1 ? navigate('/welcome') : setStep(1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 py-2"
          aria-label="Go back"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          <span className="font-semibold text-lg">Back</span>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="FriendSnap" className="h-20 w-auto" />
        </div>

        {/* Step indicator */}
        <div className="step-indicator" data-testid="step-indicator">
          <div className={`step-dot ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`} />
          <div className="w-12 h-1 bg-slate-200 rounded" />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 ? (
          /* Step 1: Choose Nickname */
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm animate-fade-in-up" data-testid="step-1">
            <div className="flex items-center gap-2 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Choose a Nickname
              </h1>
              <button
                onClick={() => speak('Choose a nickname. This is not your real name. Pick a fun name that you like!')}
                className="tts-button"
                aria-label="Read instructions"
                data-testid="tts-step1"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              This is not your real name.<br />
              Pick a fun name that you like!
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label htmlFor="nickname" className="block font-semibold text-slate-700 mb-2 text-lg">
                  Your Nickname
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Type your nickname here"
                  className="h-14 rounded-2xl border-2 text-lg px-4"
                  maxLength={20}
                  data-testid="nickname-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-semibold text-slate-700 mb-2 text-lg">
                  Choose a Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pick a password"
                  className="h-14 rounded-2xl border-2 text-lg px-4"
                  maxLength={30}
                  data-testid="password-input"
                />
                <p className="text-slate-500 text-sm mt-2">
                  Remember this password to login later
                </p>
              </div>
            </div>

            <Button
              onClick={handleStep1Continue}
              className="w-full rounded-full px-8 py-6 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg btn-press"
              data-testid="continue-btn"
            >
              <span>Continue</span>
              <ArrowRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
            </Button>
          </div>
        ) : (
          /* Step 2: Choose Avatar */
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm animate-fade-in-up" data-testid="step-2">
            <div className="flex items-center gap-2 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Pick Your Avatar
              </h1>
              <button
                onClick={() => speak('Pick your avatar. This picture shows who you are. Choose one you like!')}
                className="tts-button"
                aria-label="Read instructions"
                data-testid="tts-step2"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              This picture shows who you are.<br />
              Choose one you like!
            </p>

            <div className="avatar-grid mb-8" data-testid="avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`avatar-item ${selectedAvatar?.id === avatar.id ? 'selected' : ''}`}
                  aria-label={`Select ${avatar.name} avatar`}
                  data-testid={`avatar-${avatar.id}`}
                >
                  <img src={avatar.url} alt={avatar.name} className="w-full h-auto" />
                  {selectedAvatar?.id === avatar.id && (
                    <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button
              onClick={handleSignUp}
              disabled={loading || !selectedAvatar}
              className="w-full rounded-full px-8 py-6 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg btn-press disabled:opacity-50"
              data-testid="finish-signup-btn"
            >
              {loading ? (
                <div className="spinner w-6 h-6 border-white border-t-transparent" />
              ) : (
                <>
                  <Check className="w-6 h-6 mr-2" strokeWidth={2.5} />
                  <span>Start Using FriendSnap!</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

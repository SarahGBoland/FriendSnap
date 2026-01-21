import { useNavigate } from 'react-router-dom';
import { Camera, Users, Heart, Shield, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_share-memories-1/artifacts/0pgxf50e_ChatGPT%20Image%20Jan%2014%2C%202026%2C%2008_18_46%20PM.png";

// Text-to-speech helper
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Share Photos",
      description: "Share pictures of things you like. Animals, food, music, places!"
    },
    {
      icon: Users,
      title: "Find Friends",
      description: "Meet people who like the same things as you."
    },
    {
      icon: Heart,
      title: "No Judging",
      description: "We match you by what you like, not how you look."
    },
    {
      icon: Shield,
      title: "Stay Safe",
      description: "Easy to block or report anyone who is not nice."
    }
  ];

  const welcomeText = "Welcome to FriendSnap! Share photos of things you love and find friends who like the same things. It's easy and safe!";

  return (
    <div className="min-h-screen bg-slate-50" data-testid="landing-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-orange-50 to-slate-50">
        <div className="app-container py-8 md:py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={LOGO_URL} 
              alt="FriendSnap - Pictures That Connect" 
              className="h-32 md:h-40 w-auto animate-fade-in-up"
            />
          </div>

          {/* Welcome text with TTS */}
          <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-100">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900">
                Welcome to FriendSnap!
              </h1>
              <button
                onClick={() => speak(welcomeText)}
                className="tts-button"
                aria-label="Read welcome message aloud"
                data-testid="tts-welcome"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed">
              Share photos of things you love.<br />
              Find friends who like the same things.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-12 animate-fade-in-up animate-delay-200">
            <Button
              onClick={() => navigate('/signup')}
              className="rounded-full px-8 py-6 text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg btn-press flex-1"
              data-testid="get-started-btn"
            >
              Get Started
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="rounded-full px-8 py-6 text-xl font-bold border-2 border-slate-200 hover:bg-slate-100 text-slate-700 flex-1"
              data-testid="login-btn"
            >
              I Have an Account
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="app-container py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-8">
          What is FriendSnap?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm card-hover animate-fade-in-up"
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-2xl shrink-0">
                  <feature.icon className="w-8 h-8 text-orange-500" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-slate-600 text-base leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules reminder */}
      <div className="app-container pb-12">
        <div className="bg-blue-50 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto border-2 border-blue-100">
          <h3 className="font-bold text-xl text-blue-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" strokeWidth={2.5} />
            Our Simple Rules
          </h3>
          <ul className="space-y-3 text-blue-800 text-lg">
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Share photos of things, not people
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Be kind to everyone
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              Use a nickname, not your real name
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

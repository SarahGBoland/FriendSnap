import { useState } from 'react';
import { User, LogOut, Volume2, Shield, Camera } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Goodbye! See you soon!');
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="profile-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <h1 className="font-bold text-2xl text-slate-900">My Profile</h1>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const text = `This is your profile page, ${user?.nickname}. You can see your photos and log out here.`;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="tts-button"
            aria-label="Read page info"
            data-testid="tts-profile"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="app-container py-6">
        {/* Profile card */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 mb-6 text-center" data-testid="profile-card">
          <img
            src={user?.avatar_url}
            alt=""
            className="w-24 h-24 rounded-full mx-auto mb-4 bg-slate-100"
          />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{user?.nickname}</h2>
          <p className="text-slate-500">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
        </div>

        {/* Quick actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => navigate('/my-photos')}
            className="w-full bg-white rounded-2xl border-2 border-slate-100 p-5 flex items-center gap-4 text-left card-hover"
            data-testid="view-photos-btn"
          >
            <div className="p-3 bg-orange-100 rounded-xl">
              <Camera className="w-6 h-6 text-orange-500" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">My Photos</h3>
              <p className="text-slate-500">See all your shared photos</p>
            </div>
          </button>
        </div>

        {/* Rules reminder */}
        <div className="bg-blue-50 rounded-2xl p-5 mb-8 border-2 border-blue-100">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-500 shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Remember Our Rules</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• Share photos of things, not people</li>
                <li>• Be kind to everyone</li>
                <li>• Report anything that makes you uncomfortable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="outline"
          className="w-full rounded-2xl px-6 py-5 text-lg font-bold border-2 border-red-200 text-red-600 hover:bg-red-50"
          data-testid="logout-btn"
        >
          <LogOut className="w-6 h-6 mr-3" strokeWidth={2.5} />
          Log Out
        </Button>
      </div>

      {/* Logout confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-3xl" data-testid="logout-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Log Out?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full px-6 py-4 text-lg font-semibold" data-testid="cancel-logout">
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-full px-6 py-4 text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
              data-testid="confirm-logout"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

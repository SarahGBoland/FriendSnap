import { useState, useEffect } from 'react';
import { Camera, Users, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import TTSButton from '../components/TTSButton';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedRes, suggestionsRes] = await Promise.all([
        axios.get(`${API}/photos/feed`),
        axios.get(`${API}/friends/suggestions`)
      ]);
      setPhotos(feedRes.data);
      setSuggestions(suggestionsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="home-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={user?.avatar_url} 
              alt="" 
              className="w-12 h-12 rounded-full bg-slate-100"
            />
            <div>
              <p className="text-slate-500 text-sm">Hello!</p>
              <h1 className="font-bold text-xl text-slate-900">{user?.nickname}</h1>
            </div>
          </div>
          <TTSButton text={`Hello ${user?.nickname}! This is your home page. See photos from friends and people you might like.`} />
        </div>
      </header>

      <div className="app-container py-6">
        {/* Quick action buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => navigate('/add-photo')}
            className="flex-1 rounded-2xl px-6 py-5 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md btn-press"
            data-testid="add-photo-btn"
          >
            <Camera className="w-6 h-6 mr-2" strokeWidth={2.5} />
            Add Photo
          </Button>
          <Button
            onClick={() => navigate('/friends')}
            variant="outline"
            className="flex-1 rounded-2xl px-6 py-5 text-lg font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700"
            data-testid="find-friends-btn"
          >
            <Users className="w-6 h-6 mr-2" strokeWidth={2.5} />
            Find Friends
          </Button>
        </div>

        {/* Friend Suggestions */}
        {suggestions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">People You Might Like</h2>
              <button
                onClick={() => navigate('/friends')}
                className="text-orange-500 font-semibold hover:underline"
                data-testid="see-all-friends"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.user.id}
                  className="friend-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`suggestion-${index}`}
                >
                  <img
                    src={suggestion.user.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-full bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg truncate">
                      {suggestion.user.nickname}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {suggestion.shared_interests.slice(0, 2).map((interest, i) => (
                        <span key={i} className="interest-tag text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/chat/${suggestion.user.id}`)}
                    className="rounded-full px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold btn-press shrink-0"
                    data-testid={`say-hi-${index}`}
                  >
                    Say Hi!
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo Feed */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Photo Feed</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : photos.length === 0 ? (
            <div className="empty-state bg-white rounded-3xl border-2 border-slate-100">
              <Camera className="w-20 h-20 text-slate-300 mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-xl text-slate-900 mb-2">No photos yet!</h3>
              <p className="text-slate-600 text-lg mb-6">
                Be the first to share a photo.
              </p>
              <Button
                onClick={() => navigate('/add-photo')}
                className="rounded-full px-8 py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="empty-add-photo"
              >
                Add Your First Photo
              </Button>
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="photo-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`photo-${index}`}
                >
                  <img
                    src={`data:image/jpeg;base64,${photo.image_base64}`}
                    alt={photo.description || photo.category}
                  />
                  <div className="photo-card-overlay">
                    <div className="flex items-center gap-2">
                      <img
                        src={photo.user?.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full bg-white/20"
                      />
                      <span className="font-semibold text-sm truncate">
                        {photo.user?.nickname}
                      </span>
                    </div>
                    {photo.category && (
                      <span className="text-xs opacity-80 mt-1 block capitalize">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

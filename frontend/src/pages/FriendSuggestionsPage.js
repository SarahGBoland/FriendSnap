import { useState, useEffect } from 'react';
import { Users, MessageCircle, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Text-to-speech helper
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export default function FriendSuggestionsPage() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suggestionsRes, friendsRes] = await Promise.all([
        axios.get(`${API}/friends/suggestions`),
        axios.get(`${API}/friends/list`)
      ]);
      setSuggestions(suggestionsRes.data);
      setFriends(friendsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="friends-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <h1 className="font-bold text-2xl text-slate-900">Friends</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-3 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Refresh"
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => speak('Find people who like similar things. We match you based on your photos!')}
              className="tts-button"
              aria-label="Read instructions"
              data-testid="tts-friends"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="app-container py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl border-2 border-slate-100">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            data-testid="tab-suggestions"
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors ${
              activeTab === 'friends'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            data-testid="tab-friends"
          >
            My Friends ({friends.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : activeTab === 'suggestions' ? (
          /* Suggestions tab */
          suggestions.length === 0 ? (
            <div className="empty-state bg-white rounded-3xl border-2 border-slate-100">
              <Users className="w-20 h-20 text-slate-300 mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-xl text-slate-900 mb-2">No suggestions yet</h3>
              <p className="text-slate-600 text-lg mb-6">
                Add more photos to help us find people who like the same things!
              </p>
              <Button
                onClick={() => navigate('/add-photo')}
                className="rounded-full px-8 py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="add-photos-cta"
              >
                Add Photos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.user.id}
                  className="bg-white rounded-3xl border-2 border-slate-100 p-5 card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`friend-suggestion-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={suggestion.user.avatar_url}
                      alt=""
                      className="w-16 h-16 rounded-full bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-slate-900 mb-2">
                        {suggestion.user.nickname}
                      </h3>
                      
                      {suggestion.shared_interests.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {suggestion.shared_interests.map((interest, i) => (
                            <p key={i} className="text-slate-600 flex items-center gap-2">
                              <span className="text-lg">❤️</span>
                              {interest}
                            </p>
                          ))}
                        </div>
                      )}

                      {suggestion.sample_photo && (
                        <div className="w-24 h-24 rounded-xl overflow-hidden mb-3">
                          <img
                            src={`data:image/jpeg;base64,${suggestion.sample_photo}`}
                            alt="Sample photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/chat/${suggestion.user.id}`)}
                    className="w-full mt-4 rounded-full px-6 py-4 text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white btn-press"
                    data-testid={`chat-with-${index}`}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" strokeWidth={2.5} />
                    Say Hi!
                  </Button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Friends tab */
          friends.length === 0 ? (
            <div className="empty-state bg-white rounded-3xl border-2 border-slate-100">
              <Users className="w-20 h-20 text-slate-300 mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-xl text-slate-900 mb-2">No friends yet</h3>
              <p className="text-slate-600 text-lg mb-6">
                Start chatting with people to become friends!
              </p>
              <Button
                onClick={() => setActiveTab('suggestions')}
                className="rounded-full px-8 py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="view-suggestions-cta"
              >
                View Suggestions
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <div
                  key={friend.id}
                  className="friend-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`friend-${index}`}
                >
                  <img
                    src={friend.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-full bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg truncate">
                      {friend.nickname}
                    </h3>
                    <p className="text-slate-500 text-sm">Friend</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/chat/${friend.id}`)}
                    className="rounded-full px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold btn-press shrink-0"
                    data-testid={`message-friend-${index}`}
                  >
                    <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}

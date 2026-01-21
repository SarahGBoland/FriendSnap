import { useState, useEffect } from 'react';
import { MessageCircle, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="chat-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <h1 className="font-bold text-2xl text-slate-900">Messages</h1>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const text = `You have ${conversations.length} conversations. Tap on someone to chat with them.`;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="tts-button"
            aria-label="Read page info"
            data-testid="tts-chat"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="app-container py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state bg-white rounded-3xl border-2 border-slate-100">
            <MessageCircle className="w-20 h-20 text-slate-300 mb-4" strokeWidth={1.5} />
            <h3 className="font-bold text-xl text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-600 text-lg mb-6">
              Find someone to chat with in the Friends section!
            </p>
            <Button
              onClick={() => navigate('/friends')}
              className="rounded-full px-8 py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="find-friends-cta"
            >
              Find Friends
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, index) => (
              <button
                key={conv.partner.id}
                onClick={() => navigate(`/chat/${conv.partner.id}`)}
                className="w-full friend-card text-left animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`conversation-${index}`}
              >
                <div className="relative">
                  <img
                    src={conv.partner.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-full bg-slate-100 shrink-0"
                  />
                  {conv.unread_count > 0 && (
                    <span className="notification-badge">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate">
                    {conv.partner.nickname}
                  </h3>
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                    {conv.last_message.is_mine && 'You: '}
                    {conv.last_message.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

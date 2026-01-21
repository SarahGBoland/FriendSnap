import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image, Flag, Ban, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Sentence starters for easy communication
const SENTENCE_STARTERS = [
  "I like this too!",
  "This is cool!",
  "Tell me more!",
  "Me too!",
  "That's nice!",
  "Wow!",
];

// Common emojis
const COMMON_EMOJIS = ["😊", "👍", "❤️", "🎉", "⭐", "🌟", "🎵", "🐶", "🐱", "🌸", "🌈", "☀️", "🍕", "⚽", "🎨", "📷"];

export default function ConversationPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${userId}`);
      setMessages(response.data);
      
      // Get partner info from first message or suggestions
      if (response.data.length > 0) {
        const suggestionsRes = await axios.get(`${API}/friends/suggestions`);
        const friendsRes = await axios.get(`${API}/friends/list`);
        const allUsers = [...suggestionsRes.data.map(s => s.user), ...friendsRes.data];
        const foundPartner = allUsers.find(u => u.id === userId);
        if (foundPartner) {
          setPartner(foundPartner);
        }
      } else {
        // Fetch from suggestions or friends list
        const [suggestionsRes, friendsRes] = await Promise.all([
          axios.get(`${API}/friends/suggestions`),
          axios.get(`${API}/friends/list`)
        ]);
        const allUsers = [...suggestionsRes.data.map(s => s.user), ...friendsRes.data];
        const foundPartner = allUsers.find(u => u.id === userId);
        if (foundPartner) {
          setPartner(foundPartner);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content, type = 'text') => {
    if (!content.trim()) return;
    
    setSending(true);
    try {
      const response = await axios.post(`${API}/messages`, {
        receiver_id: userId,
        content: content,
        message_type: type
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      setShowEmojis(false);
    } catch (error) {
      toast.error('Could not send message. Try again!');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    try {
      await axios.post(`${API}/report`, {
        reported_user_id: userId,
        reason: 'Reported from chat'
      });
      toast.success('Thank you for reporting. We will review this.');
    } catch (error) {
      toast.error('Could not report. Try again!');
    }
  };

  const handleBlock = async () => {
    try {
      await axios.post(`${API}/block`, {
        blocked_user_id: userId
      });
      toast.success('User blocked');
      navigate('/chat');
    } catch (error) {
      toast.error('Could not block user. Try again!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="conversation-page">
      {/* Header */}
      <header className="nav-header shrink-0">
        <div className="app-container flex items-center gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full"
            aria-label="Go back"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" strokeWidth={2.5} />
          </button>
          
          {partner && (
            <div className="flex items-center gap-3 flex-1">
              <img
                src={partner.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full bg-slate-100"
              />
              <h1 className="font-bold text-xl text-slate-900 truncate">
                {partner.nickname}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const text = `Chatting with ${partner?.nickname || 'friend'}. Send messages using text or emojis.`;
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.rate = 0.9;
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className="tts-button"
              aria-label="Read page info"
              data-testid="tts-conversation"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 hover:bg-slate-100 rounded-full"
                  aria-label="More options"
                  data-testid="more-options-btn"
                >
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleReport}
                  className="text-lg py-3 cursor-pointer"
                  data-testid="report-user-btn"
                >
                  <Flag className="w-5 h-5 mr-3 text-orange-500" />
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleBlock}
                  className="text-lg py-3 text-red-600 cursor-pointer"
                  data-testid="block-user-btn"
                >
                  <Ban className="w-5 h-5 mr-3" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" data-testid="messages-area">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              Say hi to start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${index}`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-3 text-lg ${
                      isMine ? 'message-mine' : 'message-other'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sentence starters */}
      <div className="px-4 py-2 overflow-x-auto shrink-0">
        <div className="flex gap-2">
          {SENTENCE_STARTERS.map((starter) => (
            <button
              key={starter}
              onClick={() => sendMessage(starter)}
              className="sentence-starter"
              disabled={sending}
              data-testid={`starter-${starter.substring(0, 5)}`}
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0" data-testid="emoji-picker">
          <div className="emoji-grid max-w-md mx-auto">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendMessage(emoji, 'emoji')}
                className="emoji-btn"
                disabled={sending}
                data-testid={`emoji-${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="chat-input-area shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={`p-3 rounded-full transition-colors ${showEmojis ? 'bg-orange-100 text-orange-500' : 'hover:bg-slate-100 text-slate-500'}`}
            aria-label="Toggle emojis"
            data-testid="toggle-emoji-btn"
          >
            <span className="text-2xl">😊</span>
          </button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            placeholder="Type a message..."
            className="flex-1 h-14 rounded-2xl border-2 text-lg"
            disabled={sending}
            data-testid="message-input"
          />
          
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={sending || !newMessage.trim()}
            className="rounded-full p-4 bg-orange-500 hover:bg-orange-600 text-white btn-press"
            aria-label="Send message"
            data-testid="send-btn"
          >
            {sending ? (
              <div className="spinner w-6 h-6 border-white border-t-transparent" />
            ) : (
              <Send className="w-6 h-6" strokeWidth={2.5} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

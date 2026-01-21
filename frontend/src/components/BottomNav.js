import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera, Users, MessageCircle, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/add-photo', icon: Camera, label: 'Add Photo' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 z-50 bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/chat' && location.pathname.startsWith('/chat'));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-colors min-w-[64px] ${
                isActive 
                  ? 'bg-orange-100 text-orange-500' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon 
                className={`w-7 h-7 mb-1 ${isActive ? 'text-orange-500' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-xs font-semibold ${isActive ? 'text-orange-500' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

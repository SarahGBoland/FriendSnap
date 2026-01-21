import { useState } from 'react';
import { HelpCircle, X, Camera, Users, MessageCircle, Shield, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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

const HelpModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const helpTopics = [
    {
      icon: Camera,
      title: "How to add photos",
      content: "Tap the camera button at the bottom. Take a photo or choose from your phone. Share photos of things you like - animals, food, places, music, art!"
    },
    {
      icon: Users,
      title: "Finding friends",
      content: "Go to Friends page. We show people who like similar things. If you both like animals, we tell you! Tap 'Say Hi' to start a chat."
    },
    {
      icon: MessageCircle,
      title: "Sending messages",
      content: "Go to Chat page. Pick a friend to talk to. You can send text, emojis, or pictures. Use the quick phrases if you're not sure what to say!"
    },
    {
      icon: Shield,
      title: "Staying safe",
      content: "Only share photos of things, not people. If someone is mean, tap the flag button to report them. You can block anyone you don't like."
    }
  ];

  return (
    <>
      {/* Fixed Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="help-button-fixed flex items-center gap-2 px-5 py-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors btn-press"
        aria-label="Get Help"
        data-testid="help-button"
      >
        <HelpCircle className="w-6 h-6" strokeWidth={2.5} />
        <span className="font-bold text-lg">Help</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-0 overflow-hidden" data-testid="help-modal">
          <DialogHeader className="p-6 pb-4 bg-blue-500 text-white">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <HelpCircle className="w-8 h-8" strokeWidth={2.5} />
              How can we help?
            </DialogTitle>
            <p className="text-blue-100 mt-2 text-lg">
              Tap on a topic to learn more
            </p>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {helpTopics.map((topic, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl shrink-0">
                    <topic.icon className="w-7 h-7 text-orange-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{topic.title}</h3>
                    <p className="text-slate-600 text-base leading-relaxed">{topic.content}</p>
                  </div>
                  <button
                    onClick={() => speak(`${topic.title}. ${topic.content}`)}
                    className="tts-button shrink-0"
                    aria-label={`Listen to ${topic.title}`}
                    data-testid={`tts-help-${index}`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-pink-50 rounded-2xl p-5 border-2 border-pink-100 mt-6">
              <p className="text-slate-700 text-lg text-center">
                <strong>Need more help?</strong><br />
                Ask a support person you trust.
              </p>
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-slate-100">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-full px-8 py-6 text-xl font-bold bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="close-help-btn"
            >
              Close Help
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpModal;

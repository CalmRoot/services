import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';

const SageChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am Sage, your CalmRoot wellness companion. How are you feeling today? 🌿',
      model: 'amazon-nova-lite'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestModel, setLatestModel] = useState('amazon-nova-lite');
  const [userContext, setUserContext] = useState({});
  const messagesEndRef = useRef(null);

  // Only render for regular users (role === 'user')
  if (!user || user.role !== 'user') return null;

  // Fetch recent context on mount or when opening
  useEffect(() => {
    if (isOpen) {
      const fetchContext = async () => {
        try {
          const res = await api.get('/api/wellness/latest');
          if (res.data.data) {
            const data = res.data.data;
            setUserContext({
              recentMoodScore: data.moodScore || null,
              riskLevel: data.riskLevel || 'unknown',
              recommendedTherapist: data.therapistRecommendation?.recommendedTherapistName || null,
              streakDays: 7 // Fallback/default or calculate if streak is in user model
            });
          }
        } catch (err) {
          console.log('Error fetching chat context:', err.message);
        }
      };
      fetchContext();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-sage-chat', handleOpenEvent);
    return () => window.removeEventListener('open-sage-chat', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const currentMessages = [...messages, userMsg];
    
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send message history (max 10 recent messages to prevent token bloat)
      const payloadMessages = currentMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await api.post('/api/wellness/chat', {
        messages: payloadMessages,
        userContext: {
          ...userContext,
          userName: user.name
        }
      });

      if (response.data.success) {
        const reply = response.data.data.response;
        const model = response.data.data.model || 'amazon-nova-lite';
        setLatestModel(model);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: reply, model }
        ]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (error) {
      console.error('Sage Chat Error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having a brief connection issue. Please give me a moment to ground myself and try again. 🌿",
          model: 'fallback'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group animate-float border border-white/20"
          style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
          aria-label="Chat with Sage"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cr-accent border-2 border-white dark:border-[#0D1117] rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cr-accent border-2 border-white dark:border-[#0D1117] rounded-full" />
          
          {/* Tooltip */}
          <div className="absolute right-16 bg-surface dark:bg-[#161B22] text-text dark:text-white border border-border px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Chat with Sage ✨
          </div>
        </button>
      )}

      {/* CHAT DRAWER / WINDOW */}
      {isOpen && (
        <div
          className="w-80 sm:w-96 h-[500px] rounded-3xl flex flex-col shadow-2xl border border-cr-border/40 overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(247, 245, 240, 0.9), rgba(238, 242, 236, 0.9))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-cr-border/40" style={{ background: 'linear-gradient(135deg, #2D5A3D, #4A7C59)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md border border-white/30 text-white">
                🌿
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-sm flex items-center gap-1.5">
                  Sage <Sparkles className="w-3.5 h-3.5 text-cr-accent" />
                </h3>
                <p className="text-[10px] text-white/70 font-mono">CalmRoot AI Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-white dark:bg-[#161B22] text-text border border-cr-border/30 rounded-tl-none shadow-sm'
                        : 'text-white rounded-tr-none shadow-md'
                    }`}
                    style={!isAssistant ? { background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' } : {}}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {isAssistant && msg.model && (
                      <span className="block text-[8px] text-muted mt-1 font-mono text-right">
                        via {msg.model}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#161B22] text-text border border-cr-border/30 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cr-primary animate-spin" />
                  <span className="text-xs text-muted font-medium">Sage is reflecting...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <form onSubmit={handleSend} className="p-3 border-t border-cr-border/40 bg-white/40 dark:bg-black/10 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to Sage..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-cr-border/50 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cr-primary/20 focus:border-cr-primary transition-all text-sm dark:bg-[#0D1117] dark:focus:bg-[#161B22] dark:border-border/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Model info at bottom */}
          <div className="px-4 py-1.5 bg-cr-surface-alt dark:bg-[#161B22] text-center border-t border-cr-border/20">
            <span className="text-[9px] text-muted font-mono">
              🔒 Safe & Supportive AI Companion • model: {latestModel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SageChatWidget;

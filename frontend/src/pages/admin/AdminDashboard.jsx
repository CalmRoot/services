import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle, HelpCircle, Coins, Calendar, TrendingUp, Users, MessageSquare, Sparkles, LogOut } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Admin Chatbot State
  const [botMessages, setBotMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your CalmRoot Platform Assistant. Ask me about monthly revenue, top earners, or platform status.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const thRes = await api.get('/api/auth/therapists');
      setTherapists(thRes.data.data || []);

      const stRes = await api.get('/api/therapist/admin/stats');
      setStats(stRes.data.data);
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      const res = await api.patch(`/api/auth/therapists/${id}/verify`, { 
        action: status ? 'approve' : 'reject' 
      });

      if (res.data.success) {
        setTherapists(prev => prev.map(t => 
          t._id === id 
            ? { ...t, 
                isVerified: status,
                therapistProfile: { 
                  ...t.therapistProfile, 
                  isVerified: status 
                }
              } 
            : t
        ));
        setMessage(status ? '✅ Therapist approved successfully!' : '❌ Therapist revoked!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('❌ Action failed. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCustomQuery = (text) => {
    if (!text.trim() || isTyping) return;
    setIsTyping(true);

    const query = text.toLowerCase();
    let reply = '';

    // Add user message immediately
    setBotMessages(prev => [...prev, { role: 'user', content: text }]);

    if (
      (query.includes('no') && query.includes('appointment')) ||
      (query.includes('without') && query.includes('appointment')) ||
      (query.includes('no') && query.includes('session')) ||
      (query.includes('without') && query.includes('session')) ||
      query.includes('inactive')
    ) {
      const activeIds = (stats?.revenueByTherapist || []).map(r => r.therapistId);
      const inactive = therapists.filter(t => !activeIds.includes(t._id));
      if (inactive.length > 0) {
        reply = `The following therapists have no completed appointments recorded this month: ${inactive.map(t => t.name).join(', ')}.`;
      } else {
        reply = "All registered therapists have completed at least one appointment this month!";
      }
    } else if (
      query.includes('top') || 
      query.includes('best') || 
      query.includes('highest') || 
      query.includes('performer') || 
      query.includes('sharma') || 
      query.includes('priya') ||
      query.includes('earner')
    ) {
      const top = stats?.revenueByTherapist?.[0];
      if (top) {
        reply = `Our top performing therapist is ${top.therapistName}, who has generated ₹${top.revenue} from ${top.sessionCount} completed sessions.`;
      } else {
        reply = "We don't have any therapist earnings recorded yet.";
      }
    } else if (
      query.includes('revenue') || 
      query.includes('earn') || 
      query.includes('money') || 
      query.includes('performance') || 
      query.includes('profit') || 
      query.includes('income') || 
      query.includes('billing')
    ) {
      reply = `This month, CalmRoot has generated ₹${stats?.monthlyRevenue || 0} in revenue. All-time platform revenue stands at ₹${stats?.totalRevenue || 0} across ${stats?.totalSessions || 0} total sessions.`;
    } else if (
      query.includes('trend') || 
      query.includes('platform') || 
      query.includes('stat') || 
      query.includes('status') || 
      query.includes('registered') || 
      query.includes('active') || 
      query.includes('total') || 
      query.includes('awaiting') || 
      query.includes('verify')
    ) {
      const pending = therapists.filter(t => !t.therapistProfile?.isVerified).length;
      reply = `We currently have ${stats?.totalSessions || 0} total sessions. There are ${therapists.length} registered therapists, with ${pending} awaiting verification. Completed sessions this month: ${stats?.completedThisMonth || 0}.`;
    } else if (
      /\b(hi|hello|hey|help|assistant)\b/i.test(query)
    ) {
      reply = `Hello! I am your CalmRoot Platform Assistant. Ask me about monthly revenue, top earners, or platform status. You can type your question or use the quick buttons below.`;
    } else {
      reply = `I'm sorry, I couldn't find a direct match for that query. Try asking about "monthly revenue", "top earners", or "platform trends" using the quick buttons or custom typing!`;
    }

    setTimeout(() => {
      setBotMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply }
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleBotQuery = (queryType) => {
    let qText = '';
    if (queryType === 'revenue') qText = 'Explain monthly performance';
    else if (queryType === 'earner') qText = 'Who is the top earner?';
    else if (queryType === 'trends') qText = 'What are the session trends?';
    
    handleCustomQuery(qText);
  };

  const handleSendCustom = (e) => {
    e.preventDefault();
    if (!customQuery.trim() || isTyping) return;
    const queryText = customQuery.trim();
    setCustomQuery('');
    handleCustomQuery(queryText);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-bg flex justify-center items-center text-text font-bold">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>Loading Admin Panel...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="bg-accent text-white p-4 flex justify-between items-center sticky top-0 shadow-md z-10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="w-6 h-6 text-cr-primary-light" />
          <span>CalmRoot <span className="text-xs font-semibold uppercase tracking-wider text-white/60 px-2 py-0.5 rounded bg-white/10 ml-2">Admin Portal</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-mono">Theme</span>
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-300">
        
        {/* Banner Alert Message */}
        {message && (
          <div className={`p-4 rounded-xl font-bold text-center border animate-in zoom-in-95 ${
            message.includes('✅') 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-danger/10 text-danger border-danger/20'
          }`}>
            {message}
          </div>
        )}

        {/* 5-COLUMN BENTO GRID FOR METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Total Sessions
              </div>
              <div className="text-3xl font-black text-primary">{stats?.totalSessions || 0}</div>
            </div>
            <div className="text-xs text-muted mt-2">All time booked</div>
          </div>
          
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-secondary" /> Completed (Month)
              </div>
              <div className="text-3xl font-black text-secondary">{stats?.completedThisMonth || 0}</div>
            </div>
            <div className="text-xs text-muted mt-2">Current billing cycle</div>
          </div>
          
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-warning" /> Pending Approvals
              </div>
              <div className="text-3xl font-black text-warning">
                {therapists.filter(t => !t.therapistProfile?.isVerified).length}
              </div>
            </div>
            <div className="text-xs text-muted mt-2">Awaiting verification</div>
          </div>
          
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-green-500" /> Monthly Revenue
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400">₹{stats?.monthlyRevenue || 0}</div>
            </div>
            <div className="text-xs text-muted mt-2">Completed sessions</div>
          </div>
          
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-green-600" /> Total Revenue
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400">₹{stats?.totalRevenue || 0}</div>
            </div>
            <div className="text-xs text-muted mt-2">Platform total earnings</div>
          </div>
        </div>

        {/* 2-COLUMN SECTION: MAIN TABLES & CHATBOT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: THERAPIST DIRECTORY MANAGEMENT (Takes 2 columns) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border bg-surface-alt">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Therapist Directory Management
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted bg-surface-alt uppercase tracking-wider">
                      <th className="p-4 font-bold">Name & Email</th>
                      <th className="p-4 font-bold">License</th>
                      <th className="p-4 font-bold">Speciality</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {therapists.map(t => (
                      <tr key={t._id} className="hover:bg-bg/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-text text-sm">{t.name}</div>
                          <div className="text-xs text-muted">{t.email}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-xs bg-bg border border-border px-2 py-1 rounded inline-block text-text">
                            {t.therapistProfile?.licenseNumber}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs truncate max-w-[150px] text-text">
                            {t.therapistProfile?.specializations?.join(', ') || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          {t.therapistProfile?.isVerified ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full w-max border border-success/20">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full w-max border border-warning/20">
                              <AlertTriangle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!t.therapistProfile?.isVerified ? (
                            <button
                              onClick={() => handleVerify(t._id, true)}
                              className="px-3.5 py-1.5 bg-success text-white text-xs font-bold rounded-lg shadow-sm hover:bg-success/90 transition-colors"
                            >
                              Approve License
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerify(t._id, false)}
                              className="px-3.5 py-1.5 border border-danger/30 text-danger text-xs font-bold rounded-lg hover:bg-danger/10 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {therapists.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-muted">
                          No therapists registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: REVENUE BREAKDOWN & ADMIN CHATBOT (Takes 1 column) */}
          <div className="space-y-8">
            
            {/* REVENUE BY THERAPIST TABLE */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-alt flex justify-between items-center">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Coins className="w-4 h-4 text-secondary" /> Therapist Earnings
                </h3>
              </div>
              <div className="p-4 max-h-[280px] overflow-y-auto">
                <div className="space-y-3">
                  {stats?.revenueByTherapist && stats.revenueByTherapist.length > 0 ? (
                    stats.revenueByTherapist.map(r => (
                      <div key={r.therapistId} className="flex justify-between items-center p-3 rounded-xl bg-bg/40 border border-border">
                        <div className="overflow-hidden mr-2">
                          <div className="text-xs font-bold truncate text-text">{r.therapistName}</div>
                          <div className="text-[10px] text-muted">{r.sessionCount} sessions completed</div>
                        </div>
                        <div className="text-sm font-black text-green-600 dark:text-green-400 whitespace-nowrap">
                          ₹{r.revenue}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted text-center py-6">No completed session earnings.</div>
                  )}
                </div>
              </div>
            </div>

            {/* ADMIN INTERACTIVE CHATBOT */}
            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-border bg-surface-alt flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Admin Assistant
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted font-semibold">Local Insight Bot</span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-bg/10">
                {botMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white ml-auto rounded-tr-none' 
                        : 'bg-surface-alt border border-border text-text mr-auto rounded-tl-none'
                    }`}
                  >
                    <div className="font-semibold mb-1 opacity-70">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-surface-alt border border-border text-text mr-auto rounded-tl-none rounded-2xl p-3 text-xs flex items-center gap-2 max-w-[85%]">
                    <span className="w-1.5 h-1.5 bg-text rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-text rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-text rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Queries & Custom Input */}
              <div className="p-3 border-t border-border bg-surface-alt space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[9px] uppercase font-bold text-muted tracking-wider">Quick Ask:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBotQuery('revenue')}
                      disabled={isTyping}
                      className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      💰 Explain Revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBotQuery('earner')}
                      disabled={isTyping}
                      className="px-2 py-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold rounded-lg hover:bg-secondary/20 transition-colors"
                    >
                      🏆 Top Earner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBotQuery('trends')}
                      disabled={isTyping}
                      className="px-2 py-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold rounded-lg hover:bg-warning/20 transition-colors"
                    >
                      📊 Platform Trends
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendCustom} className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Ask about revenue, earners, trends..."
                    disabled={isTyping}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-bg/50 focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-text"
                  />
                  <button
                    type="submit"
                    disabled={!customQuery.trim() || isTyping}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;

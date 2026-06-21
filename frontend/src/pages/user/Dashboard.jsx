import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smile, Brain, Sun, Activity, AlertCircle, Info, Star, TrendingUp, Sparkles } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../lib/axios';

const JOKE_POOL = [
  "Why did the scarecrow win an award? Because he was outstanding in his field, but he still talked it out with his therapist! 🌾",
  "Why did the bicycle collapse? Because it was two-tired! Remember to take a break. 🚲",
  "Why don't scientists trust atoms? Because they make up everything! Just like our overthinking minds sometimes do. ⚛️",
  "How does a neuron say goodbye? 'Keep in touch!' 🧠",
  "What did the grape do when he got stepped on? He let out a little wine! It is okay to vent. 🍇",
  "Why was the math book sad? Because it had too many problems. Let's solve yours one step at a time! 📚",
  "How do you organize a space party? You planet! 🪐",
  "Why did the computer go to the doctor? Because it had a virus! Even tech needs checkups. 💻",
  "Why did the cookie go to the hospital? Because it was feeling crummy! 🍪",
  "Why did the sun go to school? To get a little brighter! ☀️",
  "Why did the coffee file a police report? It got mugged! ☕",
  "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
  "What do you call a sleeping bull? A bulldozer! 🐂",
  "What did the ocean say to the shore? Nothing, it just waved! 🌊",
  "What do you call a fake noodle? An imposter! 🍜",
  "Why did the tree go to the dentist? To get a root canal! 🌳",
  "What is a tree's favorite subject? Geometry! 📐",
  "Why did the belt go to prison? Because it held up a pair of pants! 👖",
  "What did one cell say to his sister cell when she stepped in his toe? Mitosis! 🧬",
  "Why don't some couples go to the gym? Because some relationships don't work out. But you and your self-care will! 💪"
];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [wellnessAnalysis, setWellnessAnalysis] = useState(null);
  const [displayJoke, setDisplayJoke] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, insRes, sesRes, moodRes, wellnessRes] = await Promise.all([
          api.get('/api/assessment/summary'),
          api.get('/api/assessment/insights'),
          api.get('/api/therapist/sessions/upcoming'),
          api.get('/api/assessment/mood/today'),
          api.get('/api/wellness/latest')
        ]);
        
        setSummary(sumRes.data.data);
        setInsights(insRes.data.data);
        if (sesRes.data.data.length > 0) setUpcoming(sesRes.data.data[0]);
        setTodayMood(moodRes.data.data);
        setWellnessAnalysis(wellnessRes.data.data);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update randomized joke based on latest analysis or fallback
  useEffect(() => {
    const pool = [...JOKE_POOL];
    if (wellnessAnalysis?.joke && !pool.includes(wellnessAnalysis.joke)) {
      pool.push(wellnessAnalysis.joke);
    }
    const randIdx = Math.floor(Math.random() * pool.length);
    setDisplayJoke(pool[randIdx]);
  }, [wellnessAnalysis]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const diffDays = Math.floor((new Date() - new Date(isoString)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const severityColorMap = {
    'green': 'bg-success/10 text-success border-success/20',
    'yellow': 'bg-warning/10 text-warning border-warning/20',
    'orange': 'bg-moderate/10 text-moderate border-moderate/20',
    'red': 'bg-danger/10 text-danger border-danger/20',
    'blue': 'bg-secondary/10 text-secondary border-secondary/20',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex pl-64 text-text">
        <Sidebar />
        <main className="flex-1 p-8 grid gap-8 animate-pulse">
          <div className="h-8 w-64 bg-surface rounded"></div>
          <div className="h-32 bg-surface rounded-xl"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-48 bg-surface rounded-xl"></div>
            <div className="h-48 bg-surface rounded-xl"></div>
            <div className="h-48 bg-surface rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex justify-between items-end border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold text-text mb-1">Dashboard</h1>
              <p className="text-muted">Welcome back to your wellness journey.</p>
            </div>
            <div className="text-sm font-medium text-muted bg-surface px-4 py-2 rounded-lg border border-border">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* ROW 1: MOOD PITCH */}
          {!todayMood ? (
            <div className="bg-surface rounded-2xl p-6 border border-warning/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-warning"></div>
              <div>
                <h3 className="text-lg font-bold text-accent mb-2 flex items-center gap-2">
                  <Smile className="text-warning" /> How are you feeling today?
                </h3>
                <p className="text-muted text-sm">Take a moment to log your emotions and activities.</p>
              </div>
              <div className="flex gap-4">
                {[
                  { e: '😔', s: 2 }, { e: '😕', s: 4 }, { e: '😐', s: 6 }, { e: '🙂', s: 8 }, { e: '😊', s: 10 }
                ].map(m => (
                  <button
                    key={m.s}
                    onClick={() => navigate('/mood', { state: { presetScore: m.s } })}
                    className="text-3xl hover:scale-125 transition-transform bg-bg p-3 rounded-full border border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {m.e}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-success/10 rounded-2xl p-6 border border-success/20 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-success"></div>
              <div className="flex items-center gap-4">
                <div className="text-5xl bg-surface p-3 rounded-2xl shadow-sm border border-success/10">{todayMood.moodEmoji}</div>
                <div>
                  <h3 className="text-lg font-bold text-success-dark mb-1">Mood logged today!</h3>
                  <p className="text-success text-sm font-medium">Score: {todayMood.moodScore} / 10</p>
                </div>
              </div>
              <Link to="/mood" className="text-success font-semibold px-5 py-2.5 bg-surface/60 hover:bg-surface border border-success/20 rounded-xl transition-colors">
                Update log →
              </Link>
            </div>
          )}

          {/* SAGE AI WELLNESS BENTO GRID */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cr-primary" /> Sage AI Insights
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Daily Uplift (Joke) */}
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between hover:border-cr-primary/30 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cr-primary font-bold">Sage's Daily Uplift 🌿</span>
                  <div className="mt-4 p-4 rounded-xl bg-cr-surface-alt dark:bg-[#161B22] text-sm italic relative border border-border/50 text-text">
                    "{displayJoke || 'Why did the brain go to therapy? Because it had too many thoughts! 🧠'}"
                  </div>
                </div>
                <div className="text-xs text-muted mt-4 font-medium">
                  Sage AI • Uplifting thoughts
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm md:col-span-2 flex flex-col justify-between hover:border-cr-primary/30 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cr-primary font-bold block mb-3">Personalized Wellness Actions ✨</span>
                  <ul className="space-y-2">
                    {(wellnessAnalysis?.suggestions || [
                      'Take a few deep breaths and practice mindfulness',
                      'Consider journaling your thoughts today',
                      'Reach out to a trusted friend or therapist'
                    ]).map((s, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2 text-text">
                        <span className="text-cr-primary shrink-0 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  {wellnessAnalysis?.weeklyInsight && (
                    <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted">
                      💡 <strong>Weekly Insight:</strong> {wellnessAnalysis.weeklyInsight}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted mt-4 font-medium">
                  Powered by Amazon Bedrock
                </div>
              </div>

              {/* AI Therapist Matching */}
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-cr-primary/30 transition-colors">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cr-primary font-bold block">AI Therapist Match 🤝</span>
                  <h4 className="text-lg font-bold text-text">
                    {wellnessAnalysis?.therapistRecommendation?.recommendedTherapistName || 'Dr. Sarah Patel, MD'}
                  </h4>
                  <p className="text-sm text-muted">
                    {wellnessAnalysis?.therapistRecommendation?.reason || 'Recommended to support routine care check-ins. Consistent therapy is a valuable tool for maintenance and growth.'}
                  </p>
                </div>
                <div className="shrink-0">
                  <Link 
                    to="/therapists" 
                    className="px-6 py-3 bg-cr-primary text-white font-bold rounded-xl hover:bg-cr-primary-dark transition-colors shadow-sm inline-block whitespace-nowrap text-sm"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* ROW 2: WELLNESS SCORES */}
          <div className="grid md:grid-cols-3 gap-6">
            <AssessmentCard 
              title="Patient Health Questionnaire" 
              type="PHQ-9" icon={Brain} 
              data={summary?.['PHQ-9']} 
              formatDate={formatDate}
              colors={severityColorMap}
            />
            <AssessmentCard 
              title="Generalised Anxiety Disorder" 
              type="GAD-7" icon={Activity} 
              data={summary?.['GAD-7']} 
              formatDate={formatDate}
              colors={severityColorMap}
            />
            <AssessmentCard 
              title="Daily Wellness Check" 
              type="WELLNESS" icon={Sun} 
              data={summary?.['WELLNESS']} 
              formatDate={formatDate}
              colors={severityColorMap}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ROW 3: INSIGHTS */}
            <div>
              <h2 className="text-xl font-bold text-text mb-4">Your Insights</h2>
              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="bg-surface rounded-2xl p-8 border border-border text-center">
                    <Brain className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-muted">Take an assessment to receive personalised insights.</p>
                  </div>
                ) : (
                  insights.map((insight, idx) => {
                    const icons = { 'alert-circle': AlertCircle, 'brain': Brain, 'activity': Activity, 'clipboard': Info, 'trending-up': TrendingUp, 'star': Star };
                    const Icon = icons[insight.icon] || Info;
                    const styles = {
                      urgent: 'border-danger/30 bg-danger/5 shadow-sm text-danger',
                      warning: 'border-moderate/30 bg-moderate/5 text-moderate',
                      info: 'border-primary/30 bg-primary/5 text-primary',
                      success: 'border-success/30 bg-success/5 text-success'
                    };
                    return (
                      <div key={idx} className={`rounded-xl p-5 border ${styles[insight.type]} flex gap-4 items-start`}>
                        <div className={`p-2 rounded-full bg-surface/50 border border-current shrink-0 mt-0.5`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text mb-3 leading-relaxed">{insight.text}</p>
                          {insight.cta && (
                            <Link to={insight.cta.path} className="inline-block text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-white border border-current hover:-translate-y-0.5 transition-transform">
                              {insight.cta.label}
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* ROW 4: UPCOMING SESSION */}
            <div>
              <h2 className="text-xl font-bold text-text mb-4">Upcoming Session</h2>
              {upcoming ? (
                <div className="bg-accent rounded-2xl p-6 shadow-md text-white relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity"></div>
                  
                  <span className="inline-block px-3 py-1 bg-white/10 text-xs font-medium rounded-full mb-6 border border-white/20">
                    Next Appointment
                  </span>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm border border-white/30">
                      {upcoming.therapistName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{upcoming.therapistName}</h4>
                      <p className="text-white/70 text-sm">Mode: {upcoming.mode}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#0C2340] border border-white/5 rounded-xl p-4 flex justify-between items-center mb-6">
                    <div>
                      <div className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1">Date</div>
                      <div className="font-medium">{upcoming.scheduledDate}</div>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div>
                      <div className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1">Time</div>
                      <div className="font-medium">{upcoming.scheduledTime}</div>
                    </div>
                  </div>
                  
                  <Link to="/sessions" className="block w-full text-center py-3 rounded-xl border border-white/20 hover:bg-white hover:text-accent font-semibold transition-all">
                    Manage Session
                  </Link>
                </div>
              ) : (
                <div className="bg-surface rounded-2xl p-8 border border-border text-center shadow-sm">
                  <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <CalendarPlusIcon className="w-6 h-6 text-muted" />
                  </div>
                  <h3 className="text-text font-bold mb-2">No upcoming sessions</h3>
                  <p className="text-sm text-muted mb-6">Book a session with one of our verified therapists.</p>
                  <Link to="/therapists" className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm inline-block">
                    Find Therapist
                  </Link>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

const AssessmentCard = ({ title, type, icon: Icon, data, formatDate, colors }) => (
  <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col hover:border-primary/50 transition-colors group">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 bg-bg text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-text text-sm">{title}</h3>
        <p className="text-xs font-semibold text-muted tracking-wide">{type}</p>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col justify-center py-2">
      {data ? (
        <div className="text-center">
          <div className="text-4xl font-black text-text mb-3">{data.totalScore}</div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[data.severityColor] || colors['gray']}`}>
            {data.severity}
          </span>
          <div className="text-xs text-muted mt-4 font-medium">Taken {formatDate(data.takenAt)}</div>
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="px-3 py-1 bg-bg text-muted rounded-full text-xs font-bold border border-border">
            Not taken yet
          </span>
        </div>
      )}
    </div>
    
    <Link 
      to={`/assessments/take/${type.toLowerCase()}`}
      className="mt-4 w-full py-2.5 text-sm font-bold flex justify-center items-center rounded-xl bg-transparent border border-border text-text hover:bg-bg transition-colors"
    >
      Take Now →
    </Link>
  </div>
);

// Helper SVG Icon to avoid importing more
const CalendarPlusIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M10 16h4"/><path d="M12 14v4"/>
  </svg>
);

export default Dashboard;

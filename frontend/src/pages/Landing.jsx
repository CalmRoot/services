import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardList, Users, TrendingUp, Shield, ChevronDown, Menu, X } from 'lucide-react';
import ThemeToggle from '../components/shared/ThemeToggle';
import StressBusterGame from '../components/features/StressBusterGame';
import api from '../lib/axios';

/* ═══════ ANIMATED LEAF LOGO ═══════ */
const CalmRootLogo = ({ className = '' }) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none">
    <g className="transition-transform duration-500 hover:rotate-12 origin-center">
      <path d="M18 4C18 4 8 10 8 20C8 26 12 32 18 32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
      <path d="M18 4C18 4 28 10 28 20C28 26 24 32 18 32" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M18 12V32" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 18L13 14" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M18 22L23 18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="18" cy="33" r="2" fill="currentColor" opacity="0.3"/>
    </g>
  </svg>
);

/* ═══════ FLOATING PARTICLES ═══════ */
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-20 particle"
        style={{
          width: 3 + Math.random() * 5,
          height: 3 + Math.random() * 5,
          background: i % 3 === 0 ? '#6BAE7F' : i % 3 === 1 ? '#C4A882' : '#D4AF37',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 6}s`,
        }}
      />
    ))}
  </div>
);

/* ═══════ TESTIMONIALS DATA ═══════ */
const testimonials = [
  { name: 'Riya Patel', condition: 'Anxiety', stars: 5, text: 'CalmRoot helped me understand my anxiety patterns. The mood tracker is a game-changer for my daily routine.' },
  { name: 'Arjun Kumar', condition: 'Depression', stars: 5, text: 'Finding a therapist who truly listens was life-changing. The AI insights helped me track my progress beautifully.' },
  { name: 'Sneha Iyer', condition: 'Stress', stars: 4, text: 'The assessments gave me clarity about what I was going through. I feel more empowered in my mental health journey.' },
  { name: 'Vikram Reddy', condition: 'Burnout', stars: 5, text: 'After months of burnout, CalmRoot connected me with the perfect therapist. The daily check-ins keep me accountable.' },
  { name: 'Priyanka Das', condition: 'OCD', stars: 5, text: 'The combination of mood tracking and professional therapy through this platform has been transformative for me.' },
];

/* ═══════ MAIN LANDING COMPONENT ═══════ */
const Landing = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await api.get('/api/auth/therapists');
        setTherapists(res.data.data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch therapists:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTherapists();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '1,200+', label: 'Sessions Completed' },
    { value: '50+', label: 'Verified Therapists' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '4.9★', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen font-body bg-bg text-text overflow-x-hidden">

      {/* ═══════ NAVBAR ═══════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-3 bg-surface/80 dark:bg-[#161B22]/80 backdrop-blur-2xl shadow-sm border-b border-border/30' : 'py-5 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <CalmRootLogo className={`transition-colors ${scrolled ? 'text-cr-primary' : 'text-white'}`} />
            <span className={`text-2xl font-heading font-bold tracking-tight transition-colors ${scrolled ? 'text-text' : 'text-white'}`}>
              Calm<span className="text-cr-primary-light">Root</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className={`flex gap-6 text-sm font-medium transition-colors ${scrolled ? 'text-muted' : 'text-white/80'}`}>
              <a href="#features" className="hover:text-cr-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cr-primary after:transition-all hover:after:w-full">Features</a>
              <a href="#game" className="hover:text-cr-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cr-primary after:transition-all hover:after:w-full">Stress Buster</a>
              <a href="#therapists" className="hover:text-cr-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cr-primary after:transition-all hover:after:w-full">Therapists</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login" className={`px-5 py-2 rounded-full border font-medium transition-all text-sm ${scrolled ? 'border-border text-text hover:bg-bg' : 'border-white/30 text-white hover:bg-white/10'}`}>
                Sign In
              </Link>
              <Link to="/register" className="px-5 py-2 rounded-full font-medium text-white text-sm transition-all hover:scale-105 glow-primary" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
            {mobileMenu ? <X className={scrolled ? 'text-text' : 'text-white'} /> : <Menu className={scrolled ? 'text-text' : 'text-white'} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 w-full bg-surface dark:bg-[#161B22] border-b border-border shadow-lg p-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-text font-medium">Features</a>
            <a href="#game" onClick={() => setMobileMenu(false)} className="block text-text font-medium">Stress Buster</a>
            <a href="#therapists" onClick={() => setMobileMenu(false)} className="block text-text font-medium">Therapists</a>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <ThemeToggle />
              <Link to="/login" className="px-4 py-2 rounded-full border border-border text-sm font-medium">Sign In</Link>
              <Link to="/register" className="px-4 py-2 rounded-full text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════ SECTION 1: HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D2B1A 0%, #1A4A2E 40%, #2D5A3D 100%)' }}>
        <FloatingParticles />
        {/* Morphing blob */}
        <div className="absolute top-20 right-10 w-72 h-72 opacity-10 animate-morph" style={{ background: 'linear-gradient(135deg, #6BAE7F, #C4A882)' }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 opacity-10 animate-morph" style={{ background: 'linear-gradient(135deg, #D4AF37, #4A7C59)', animationDelay: '4s' }} />
        {/* Grain overlay */}
        <div className="absolute inset-0 grain-overlay" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
          {/* Eyebrow badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium text-white/80 glass border border-white/10">
            🌿 Mental Health Platform
          </span>

          {/* Main headline */}
          <h1 className="font-heading font-bold tracking-tight mb-6 leading-[1.1] text-fluid-hero">
            <span className="text-white">Find Your </span>
            <span className="gradient-text-hero">Root.</span>
            <br />
            <span className="text-white">Heal Your Mind.</span>
          </h1>

          {/* Subtext */}
          <p className="text-white/60 text-lg md:text-xl tracking-wide mb-10 max-w-xl mx-auto font-body">
            Ground Yourself. Grow Together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="px-10 py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105 glow-primary inline-flex items-center justify-center gap-2 group"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
            >
              Start Your Journey
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a href="#therapists" className="px-10 py-4 rounded-full font-bold text-white text-lg border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm inline-flex items-center justify-center">
              Explore Therapists
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {['🔒 HIPAA Compliant', '✅ 50+ Therapists', '⭐ 4.9/5 Rating'].map((badge, i) => (
              <span key={i} className="glass px-4 py-2 rounded-full text-white/70 font-medium border border-white/10">
                {badge}
              </span>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex flex-col items-center text-white/30">
            <span className="text-xs font-mono tracking-wider mb-2">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 2: LIVE STATS MARQUEE ═══════ */}
      <section className="py-6 bg-surface dark:bg-[#161B22] border-y border-border/30 overflow-hidden">
        <div className="marquee-track">
          {[...stats, ...stats].map((stat, i) => (
            <div key={i} className="flex-shrink-0 glass-light dark:glass px-8 py-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
              <span className="text-2xl font-heading font-bold text-cr-primary">{stat.value}</span>
              <span className="text-sm text-muted font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 3: BENTO GRID FEATURES ═══════ */}
      <section id="features" className="py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-fluid-heading font-bold mb-4">
              <span className="gradient-text">Your Complete Wellness Ecosystem</span>
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">Everything you need to understand, track, and improve your mental health journey.</p>
          </div>

          <div className="bento-grid">
            {/* Card 1: Mood Intelligence (2x2) */}
            <div className="bento-card perspective-card col-span-2 row-span-2 text-white relative" style={{ background: 'linear-gradient(135deg, #2D5A3D, #4A7C59)' }}>
              <div className="absolute top-4 right-4 text-4xl opacity-20">📊</div>
              <h3 className="font-heading text-2xl font-bold mb-2">Mood Intelligence</h3>
              <p className="text-white/70 text-sm mb-6">Track your emotional journey daily with AI-powered insights</p>
              {/* Mini chart visual */}
              <div className="flex items-end gap-2 h-24 mt-auto">
                {[4, 6, 5, 8, 7, 9, 8].map((val, i) => (
                  <div key={i} className="flex-1 rounded-t-md transition-all" style={{ height: `${val * 10}%`, background: `rgba(255,255,255,${0.2 + i * 0.08})` }} />
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                {['😊', '😐', '😔'].map((e, i) => (
                  <span key={i} className="text-2xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{e}</span>
                ))}
              </div>
            </div>

            {/* Card 2: AI Sage */}
            <div className="bento-card perspective-card bg-[#0D1117] text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-30 animate-pulse-soft" style={{ background: 'radial-gradient(circle, #6BAE7F, transparent)' }} />
              <h3 className="font-heading text-lg font-bold mb-1">AI Companion</h3>
              <p className="text-cr-primary-light font-mono text-xs mb-3">Powered by Amazon AI</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>🌿</div>
                <div className="glass px-3 py-1.5 rounded-xl text-xs text-white/70">"How are you feeling?"</div>
              </div>
            </div>

            {/* Card 3: Streak */}
            <div className="bento-card perspective-card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4AF37, #C4A882)' }}>
              <h3 className="font-heading text-lg font-bold text-white mb-1">Streak Tracker</h3>
              <div className="text-4xl font-heading font-bold text-white mt-2">🔥 7</div>
              <div className="flex gap-1 mt-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-white/60" />
                ))}
              </div>
            </div>

            {/* Card 4: Therapists (2 cols) */}
            <div className="bento-card perspective-card col-span-2 bg-surface dark:bg-[#161B22] border border-border">
              <h3 className="font-heading text-lg font-bold text-text mb-3">50+ Verified Therapists</h3>
              <div className="flex items-center -space-x-3 mb-3">
                {['PS', 'AM', 'KN', 'RV', 'SP'].map((initials, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-surface dark:border-[#161B22] flex items-center justify-center text-xs font-bold text-white" style={{ background: ['#4A7C59', '#7C5C9E', '#3A6B8A', '#C0705A', '#D4AF37'][i], zIndex: 5 - i }}>
                    {initials}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-surface dark:border-[#161B22] bg-cr-surface-alt dark:bg-[#21262D] flex items-center justify-center text-xs font-bold text-muted">+45</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {['Anxiety', 'Depression', 'Trauma', 'OCD', 'Grief'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-full bg-cr-surface-alt dark:bg-[#21262D] text-muted border border-border/50">{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 5: Assessments */}
            <div className="bento-card perspective-card bg-surface dark:bg-[#161B22] border border-border flex flex-col items-center justify-center text-center">
              <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2">
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="#4A7C59" strokeWidth="4" strokeDasharray="120" strokeDashoffset="30" strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <h4 className="font-heading font-bold text-sm text-text">PHQ-9, GAD-7, PSS</h4>
              <p className="text-xs text-muted mt-1">Clinical Assessments</p>
            </div>

            {/* Card 6: Game Preview */}
            <a href="#game" className="bento-card perspective-card relative cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, #1A2A1A, #2D5A3D)' }}>
              <h3 className="font-heading text-lg font-bold mb-1">Stress Buster</h3>
              <p className="text-white/60 text-xs mb-2">Whack your stress away 💥</p>
              <div className="flex gap-2">
                {['😤', '💪', '🌟'].map((e, i) => (
                  <span key={i} className="text-2xl animate-bounce-soft" style={{ animationDelay: `${i * 0.3}s` }}>{e}</span>
                ))}
              </div>
            </a>

            {/* Card 7: Security (2 cols) */}
            <div className="bento-card perspective-card col-span-2 glass-light dark:glass border border-border/30 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2D5A3D, #4A7C59)' }}>
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-text mb-1">HIPAA Compliant & Encrypted</h3>
                <p className="text-muted text-sm">Your data is encrypted end-to-end. We never share without explicit consent.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 4: STRESS BUSTER GAME ═══════ */}
      <section id="game" className="py-24 relative" style={{ background: '#0D1A0D' }}>
        <FloatingParticles />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-fluid-heading font-bold mb-3">
            <span className="gradient-text">💥 Whack Your Stress Away</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">A quick game to clear your mind</p>
          <StressBusterGame />
          <p className="text-white/30 text-sm mt-8 max-w-md mx-auto">
            This game represents your mental health journey — remove the negatives, embrace the positives 🌿
          </p>
        </div>
      </section>

      {/* ═══════ SECTION 5: HOW IT WORKS ═══════ */}
      <section className="py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-fluid-heading font-bold mb-4 gradient-text">How CalmRoot Works</h2>
          <p className="text-muted text-lg mb-16">Three simple steps to better mental health</p>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-cr-primary via-cr-accent to-cr-gold" />

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: '01', icon: '🙋', title: 'Create Account', desc: 'Sign up with your emergency contact for safety. Quick and secure.' },
                { step: '02', icon: '🤝', title: 'Get Matched', desc: 'Our AI recommends the best therapist based on your needs and preferences.' },
                { step: '03', icon: '🌱', title: 'Track & Grow', desc: 'Log moods, take assessments, chat with Sage, and watch your progress.' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl bg-surface dark:bg-[#161B22] border-2 border-cr-primary shadow-lg relative z-10">
                    {item.icon}
                  </div>
                  <span className="text-muted font-mono text-xs font-bold tracking-wider mb-2 block">{item.step}</span>
                  <h3 className="text-xl font-heading font-bold text-text mb-3">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 6: AI INTELLIGENCE ═══════ */}
      <section className="py-24 bg-surface dark:bg-[#161B22] border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Visual */}
            <div className="relative">
              <div className="w-full max-w-sm mx-auto rounded-3xl p-6 border border-border bg-bg dark:bg-[#0D1117] shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>🌿</div>
                  <div>
                    <p className="font-bold text-text text-sm">Sage AI</p>
                    <p className="text-xs text-muted">Online • Ready to help</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="glass-light dark:glass px-4 py-2 rounded-2xl rounded-tl-none text-sm text-text max-w-[80%]">
                    Hi! I noticed your mood has been improving this week 🌟
                  </div>
                  <div className="bg-cr-primary text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm ml-auto max-w-[70%]">
                    That's so nice to hear!
                  </div>
                  <div className="glass-light dark:glass px-4 py-2 rounded-2xl rounded-tl-none text-sm text-text max-w-[85%]">
                    Your 5-day streak is amazing! Keep journaling 💚
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Features */}
            <div>
              <span className="text-cr-primary font-mono text-sm font-semibold mb-4 block">AI-Powered Wellness</span>
              <h2 className="font-heading text-fluid-heading font-bold text-text mb-6">
                Intelligence That <span className="gradient-text">Cares</span>
              </h2>
              <div className="space-y-4">
                {[
                  'AI detects mood patterns and risk signals',
                  'Alerts emergency contacts when needed',
                  'Personalized therapist recommendations',
                  'AI-generated coping suggestions & jokes',
                  'Weekly wellness reports with insights',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg dark:bg-[#0D1117] border border-border/50">
                    <CheckCircle className="w-5 h-5 text-cr-primary shrink-0" />
                    <span className="text-sm font-medium text-text">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 7: TESTIMONIALS ═══════ */}
      <section className="py-24 bg-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-fluid-heading font-bold text-center mb-12 gradient-text">What Our Users Say</h2>
          <div className="overflow-hidden">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="flex-shrink-0 w-80 p-6 rounded-2xl bg-surface dark:bg-[#161B22] border border-border shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-cr-gold text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted mb-4 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{t.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cr-surface-alt dark:bg-[#21262D] text-muted">{t.condition}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 8: THERAPIST SHOWCASE ═══════ */}
      <section id="therapists" className="py-24 bg-surface dark:bg-[#161B22] border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-fluid-heading font-bold mb-4 gradient-text">Meet Our Therapists</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">All therapists are verified mental health professionals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl p-6 border border-border animate-pulse bg-bg dark:bg-[#0D1117]">
                  <div className="h-32 bg-border/30 rounded-xl mb-4" />
                  <div className="h-6 bg-border/30 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-border/30 rounded mb-4 w-1/2" />
                  <div className="h-10 bg-border/30 rounded-lg" />
                </div>
              ))
            ) : therapists.length > 0 ? (
              therapists.map((therapist) => (
                <div key={therapist._id} className="rounded-2xl overflow-hidden border border-border bg-bg dark:bg-[#0D1117] perspective-card flex flex-col">
                  <div className="p-8 flex flex-col items-center text-center relative" style={{ background: 'linear-gradient(135deg, #2D5A3D, #4A7C59)' }}>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-cr-primary-dark text-xl font-bold shadow-lg mb-3">
                      {therapist.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      {therapist.name} <CheckCircle className="w-4 h-4 text-cr-primary-light" />
                    </h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
                      {therapist.therapistProfile.specializations.slice(0, 3).map(spec => (
                        <span key={spec} className="px-2 py-0.5 bg-cr-surface-alt dark:bg-[#21262D] text-cr-primary text-xs font-semibold rounded-md border border-border/50">
                          {spec.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Experience</span>
                        <span className="font-semibold text-text">{therapist.therapistProfile.experienceYears} years</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Rating</span>
                        <span className="font-semibold text-cr-gold">★ {therapist.therapistProfile.rating}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Fee</span>
                        <span className="font-bold text-cr-primary text-lg">₹{therapist.therapistProfile.sessionPrice}</span>
                      </div>
                    </div>
                    <Link to="/login" className="w-full mt-4 py-3 rounded-xl text-center font-semibold text-sm transition-all border border-cr-primary text-cr-primary hover:bg-cr-primary hover:text-white">
                      Sign in to Book
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-muted">No therapists found.</div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/login" className="inline-flex items-center gap-2 text-cr-primary font-semibold hover:text-cr-primary-dark transition-colors">
              View All Therapists <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2D5A3D, #4A7C59)' }}>
        <FloatingParticles />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl font-bold text-white mb-6">Ready to Start Your Wellness Journey?</h2>
          <p className="text-white/80 text-xl mb-10">Join thousands of people taking charge of their mental health.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="px-10 py-4 rounded-full bg-white text-cr-primary-dark font-bold text-lg hover:scale-105 transition-all shadow-xl">
              Create Free Account
            </Link>
            <Link to="/login" className="text-white font-medium hover:text-cr-accent transition-colors">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="pt-16 pb-8 border-t border-border/20" style={{ background: '#0D1117' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Crisis Banner */}
          <div className="mb-12 p-4 rounded-2xl border-2 border-red-500/50 bg-red-500/5 text-center animate-pulse-soft">
            <p className="text-white font-bold text-sm">
              🆘 Need immediate help? <span className="text-red-400">iCall: 9152987821</span> | Emergency: <span className="text-red-400">112</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CalmRootLogo className="text-white" />
                <span className="text-xl font-heading font-bold text-white">
                  Calm<span className="text-cr-primary-light">Root</span>
                </span>
              </div>
              <p className="text-white/50 mb-6 text-sm">Ground Yourself. Grow Together.</p>
              <ThemeToggle />
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><a href="#therapists" className="hover:text-white transition-colors">Find a Therapist</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/30">
            © {new Date().getFullYear()} CalmRoot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

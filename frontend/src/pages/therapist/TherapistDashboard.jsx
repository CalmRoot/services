import { useState, useEffect } from 'react';
import { Users, Calendar, Activity, Clock, AlertTriangle, TrendingUp, X, Phone, Video, MapPin } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../lib/axios';

const TherapistDashboard = () => {
  const [todaySessions, setTodaySessions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null); // ✅ For modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, sessionsRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/therapist/my/sessions/today')
        ]);
        setProfile(meRes.data.data);
        setTodaySessions(sessionsRes.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-bg flex pl-64 pt-20 justify-center">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="flex justify-between items-end border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-bold text-text mb-1">Therapist Dashboard</h1>
              <p className="text-muted">Welcome back, {profile?.name}</p>
            </div>
            {!profile?.therapistProfile?.isVerified && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger px-4 py-2 rounded-xl text-sm font-bold border border-danger/20">
                <AlertTriangle className="w-4 h-4" /> Account Pending Verification
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-muted">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Today's Sessions</span>
              </div>
              <div className="text-4xl font-black text-accent">{todaySessions.length}</div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-muted">
                <Users className="w-5 h-5 text-secondary" />
                <span className="font-semibold text-sm">Total Clients</span>
              </div>
              <div className="text-4xl font-black text-accent">--</div>
              <div className="text-xs text-muted mt-2">Metrics available soon</div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-muted">
                <Activity className="w-5 h-5 text-success" />
                <span className="font-semibold text-sm">Completed</span>
              </div>
              <div className="text-4xl font-black text-accent">--</div>
              <div className="text-xs text-muted mt-2">Metrics available soon</div>
            </div>

            <div className="bg-gradient-to-br from-accent to-primary rounded-2xl p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="font-medium text-sm text-white/80 z-10">Current Rating</div>
              <div className="text-4xl font-black z-10">
                {profile?.therapistProfile?.rating || 'N/A'}
              </div>
              <div className="text-xs z-10 mt-2 bg-white/20 px-2 py-1 rounded inline-block self-start font-medium backdrop-blur-sm">
                {profile?.therapistProfile?.totalReviews} Reviews
              </div>
            </div>
          </div>

          {/* TODAY'S SCHEDULE */}
          <div className="pt-6">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
              <h2 className="text-xl font-bold text-accent">Today's Schedule</h2>
            </div>

            {todaySessions.length === 0 ? (
              <div className="bg-surface rounded-2xl p-12 border border-border text-center">
                <Clock className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-text">No sessions today</h3>
                <p className="text-muted text-sm mt-1">Enjoy your free time or update your availability.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {todaySessions.map((session) => (
                  <div key={session._id} className="bg-surface rounded-xl p-5 border border-border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 text-center shrink-0">
                        <div className="text-lg font-black text-primary">{session.scheduledTime}</div>
                        <div className="text-xs font-bold text-muted uppercase mt-0.5">{session.mode}</div>
                      </div>
                      <div className="w-px h-12 bg-border"></div>
                      <div>
                        <div className="font-bold text-lg text-text">{session.userName}</div>
                        <div className="text-sm text-muted font-medium flex items-center gap-2 mt-1">
                          Status:
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            session.status === 'confirmed' ? 'bg-success/10 text-success' :
                            session.status === 'completed' ? 'bg-primary/10 text-primary' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {session.status === 'confirmed' && (
                        <button className="px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm">
                          Join Video Call
                        </button>
                      )}
                      {/* ✅ View Details with onClick */}
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-4 py-2 border border-border bg-bg text-text font-bold rounded-lg hover:bg-surface text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ SESSION DETAILS MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text">Session Details</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">

              {/* Client Info */}
              <div className="bg-bg rounded-xl p-4 border border-border/50">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Client
                </div>
                <div className="text-lg font-bold text-text">{selectedSession.userName}</div>
                {selectedSession.userEmail && (
                  <div className="text-sm text-muted mt-1">{selectedSession.userEmail}</div>
                )}
              </div>

              {/* Session Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Date</div>
                  <div className="font-bold text-text">
                    {new Date(selectedSession.scheduledDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Time</div>
                  <div className="font-bold text-text">{selectedSession.scheduledTime}</div>
                </div>
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Mode</div>
                  <div className="font-bold text-text flex items-center gap-2">
                    {selectedSession.mode === 'video' ? (
                      <><Video className="w-4 h-4 text-primary" /> Video Call</>
                    ) : selectedSession.mode === 'audio' ? (
                      <><Phone className="w-4 h-4 text-primary" /> Audio Call</>
                    ) : (
                      <><MapPin className="w-4 h-4 text-primary" /> In Person</>
                    )}
                  </div>
                </div>
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Status</div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    selectedSession.status === 'confirmed' ? 'bg-success/10 text-success' :
                    selectedSession.status === 'completed' ? 'bg-primary/10 text-primary' :
                    selectedSession.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>

              {/* Duration & Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Duration</div>
                  <div className="font-bold text-text">{selectedSession.durationMinutes || 50} mins</div>
                </div>
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Session Fee</div>
                  <div className="font-bold text-primary">₹{selectedSession.sessionFee || profile?.therapistProfile?.sessionPrice || 'N/A'}</div>
                </div>
              </div>

              {/* Notes if any */}
              {selectedSession.userNotes && (
                <div className="bg-bg rounded-xl p-4 border border-border/50">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Patient Notes
                  </div>
                  <div className="text-sm text-text">{selectedSession.userNotes}</div>
                </div>
              )}

              {/* Session Number */}
              {selectedSession.sessionNumber && (
                <div className="text-xs text-muted text-center">
                  Session #{selectedSession.sessionNumber}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setSelectedSession(null)}
                className="flex-1 py-2.5 border border-border text-text font-bold rounded-xl hover:bg-bg transition-colors"
              >
                Close
              </button>
              {selectedSession.status === 'confirmed' && (
                <button className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Join Video Call
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;

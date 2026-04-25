/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  LayoutDashboard, 
  CheckCircle2, 
  Timer, 
  Plus, 
  Search,
  Menu,
  ChevronRight,
  Flame,
  Clock,
  CircleCheck,
  Shield,
  UploadCloud,
  MoreVertical,
  ArrowRight,
  Bolt,
  Zap,
  User,
  Mail,
  School,
  Camera,
  Save,
  X,
  FileText,
  StickyNote,
  Trash2,
  ChevronLeft,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  GraduationCap,
  ChevronDown,
  Target,
  Coffee,
  Activity
} from 'lucide-react';
import { Task, StudySession, Note, UserProfile } from './types';

// Mock Initial Data
const INITIAL_USER: UserProfile = {
  name: '',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
  email: '',
  bio: '',
  institution: '',
  grade: '',
  streak: 0,
  lastStudyDate: null,
  onboarded: false
};

const INITIAL_TASKS: Task[] = [
// ... rest of the file
  { id: '1', title: 'Advanced Calculus Quiz', category: 'Mathematics', time: '2:00 PM', durationMins: 45, completed: false, priority: 'high' },
  { id: '2', title: 'Thesis Bibliography Review', category: 'History', dueDate: 'Tomorrow', durationMins: 90, completed: false, priority: 'medium' },
  { id: '3', title: 'Biology Lab Report', category: 'Science', dueDate: 'Fri, Oct 12', durationMins: 60, completed: false, priority: 'medium' },
  { id: '4', title: 'Physics Lab Report Submission', category: 'Physics', durationMins: 30, completed: true, priority: 'low' },
];

const INITIAL_SESSIONS: StudySession[] = [
  { id: '1', type: 'focus', subject: 'Mathematics', startTime: '09:00', durationMins: 50, durationSecs: 3000, date: new Date().toISOString().split('T')[0] },
];

const INITIAL_NOTES: Note[] = [
  { id: '1', title: 'Quantum Mechanics Basics', content: 'Study the wave-particle duality and Schrödinger equation fundamentals.', updatedAt: '2h ago', subject: 'Physics' },
  { id: '2', title: 'Calculus Theorems', content: 'Mean Value Theorem: If f is continuous on [a,b] and differentiable on (a,b)...', updatedAt: '5h ago', subject: 'Mathematics' },
  { id: '3', title: 'Project Research Ideas', content: '- Impact of AI on education\n- Renewable energy efficiency\n- Mental health in students', updatedAt: 'yesterday', subject: 'General' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'study' | 'notes' | 'profile'>('home');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('studyflow_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('studyflow_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('studyflow_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('studyflow_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });
  const [alarmTime, setAlarmTime] = useState<string | null>(() => localStorage.getItem('studyflow_alarm_time'));
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(() => localStorage.getItem('studyflow_alarm_enabled') === 'true');
  const [hasAlarmTriggeredToday, setHasAlarmTriggeredToday] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
  const [sessionSummary, setSessionSummary] = useState<{subject: string, totalSecs: number, date: string} | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showNote = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = (freq: number = 880, duration: number = 500, type: OscillatorType = 'sine') => {
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      
      const oscillator = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration/1000);

      oscillator.start();
      oscillator.stop(audioCtxRef.current.currentTime + duration/1000);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // Timer Persistence
  const [timerState, setTimerState] = useState<{
    workH: number | string;
    workM: number | string;
    workS: number | string;
    breakH: number | string;
    breakM: number | string;
    breakS: number | string;
    timeLeft: number;
    isActive: boolean;
    selectedSubject: string;
    stage: 'work-1' | 'break' | 'work-2';
    breakFraction: number;
    lastUpdated: number;
  }>(() => {
    const saved = localStorage.getItem('studyflow_timer_state_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isActive) {
        const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
        parsed.timeLeft = Math.max(0, parsed.timeLeft - elapsed);
        // If it was already near 0, just keep it 0
      }
      return parsed;
    }
    return {
      workH: 0, workM: 25, workS: 0,
      breakH: 0, breakM: 5, breakS: 0,
      timeLeft: 25 * 60 / 2,
      isActive: false,
      selectedSubject: 'General',
      stage: 'work-1',
      breakFraction: 0.5,
      lastUpdated: Date.now()
    };
  });

  // Sync Timer Persistence
  useEffect(() => {
    localStorage.setItem('studyflow_timer_state_v2', JSON.stringify({
      ...timerState,
      lastUpdated: Date.now()
    }));
  }, [timerState]);

  // Global Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timerState.isActive && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
          lastUpdated: Date.now()
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isActive) {
      handleGlobalStageComplete();
    }
    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.timeLeft]);

  const handleGlobalStageComplete = () => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const wt = (Number(timerState.workH) || 0) * 3600 + (Number(timerState.workM) || 0) * 60 + (Number(timerState.workS) || 0);
    const bt = (Number(timerState.breakH) || 0) * 3600 + (Number(timerState.breakM) || 0) * 60 + (Number(timerState.breakS) || 0);
    const effectiveWt = Math.max(wt, 2); 
    const effectiveBt = bt;
    const t1 = bt > 0 ? Math.floor(effectiveWt * timerState.breakFraction) : effectiveWt;
    const t2 = effectiveWt - t1;

    if (timerState.stage === 'work-1') {
      playTone(440, 800, 'triangle');
      if (bt > 0) {
        setTimerState(prev => ({
          ...prev,
          stage: 'break',
          timeLeft: Math.max(effectiveBt, 1),
          isActive: true
        }));
        showNote(`${Math.round(timerState.breakFraction * 100)}% focus complete! Starting break.`, 'success');
      } else {
        finishGlobalSession(today, nowTime, effectiveWt, timerState.selectedSubject, t1);
      }
    } else if (timerState.stage === 'break') {
      playTone(880, 800, 'sine');
      
      const breakSession: StudySession = {
        id: `break-${Date.now()}`,
        type: 'break',
        subject: timerState.selectedSubject,
        startTime: nowTime,
        durationMins: Math.floor(effectiveBt / 60),
        durationSecs: effectiveBt,
        date: today
      };
      setSessions(prev => [breakSession, ...prev]);

      setPersistentAnalytics(prev => {
        const current = prev[timerState.selectedSubject] || { focus: 0, break: 0 };
        return {
          ...prev,
          [timerState.selectedSubject]: {
            ...current,
            break: current.break + effectiveBt
          }
        };
      });

      setTimerState(prev => ({
        ...prev,
        stage: 'work-2',
        timeLeft: t2,
        isActive: true
      }));
      showNote("Break finished! Resuming second half.", 'info');
    } else {
      finishGlobalSession(today, nowTime, effectiveWt, timerState.selectedSubject, t1);
    }
  };

  const bumpStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (user.lastStudyDate === yesterdayStr) {
        newStreak = user.streak + 1;
      }
      setUser(prev => ({ ...prev, streak: newStreak, lastStudyDate: today }));
    }
  };

  const finishGlobalSession = (today: string, nowTime: string, effectiveWt: number, selectedSubject: string, t1: number) => {
    setTimerState(prev => ({ ...prev, isActive: false, stage: 'work-1', timeLeft: t1 }));
    playTone(1050, 1000, 'sine');
    
    const durationSecs = effectiveWt;
    const durationMins = Math.floor(effectiveWt / 60);
    const newSession: StudySession = {
      id: Date.now().toString(),
      type: 'focus',
      subject: selectedSubject,
      startTime: nowTime,
      durationMins: durationMins,
      durationSecs: durationSecs,
      date: today
    };
    setSessions(prev => [newSession, ...prev]);

    setPersistentAnalytics(prev => {
      const current = prev[selectedSubject] || { focus: 0, break: 0 };
      return {
        ...prev,
        [selectedSubject]: {
          ...current,
          focus: current.focus + durationSecs
        }
      };
    });

    setPersistentFocusHistory(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + durationSecs
    }));

    setSessionSummary({ subject: selectedSubject, totalSecs: durationSecs, date: today });
    showNote("Focus session fully complete! Great work. 🎉", 'success');
  };

  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  useEffect(() => {
    let soundInterval: any = null;
    let stopTimeout: any = null;

    const handleAlarm = (e: any) => {
      const time = e.detail?.time;
      setIsAlarmRinging(true);
      showNote(`ALARM! It's ${time}. Time to flow! 🔔`, 'warning');

      const playBeep = () => {
        playTone(880, 150, 'square');
        setTimeout(() => playTone(880, 150, 'square'), 200);
        setTimeout(() => playTone(880, 150, 'square'), 400);
      };

      playBeep();
      soundInterval = setInterval(playBeep, 1000);

      stopTimeout = setTimeout(() => {
        clearInterval(soundInterval);
        setIsAlarmRinging(false);
      }, 30000);
    };

    if (!isAlarmRinging) {
      clearInterval(soundInterval);
      clearTimeout(stopTimeout);
    }

    window.addEventListener('studyflow-alarm-trigger', handleAlarm);
    return () => {
      window.removeEventListener('studyflow-alarm-trigger', handleAlarm);
      clearInterval(soundInterval);
      clearTimeout(stopTimeout);
    };
  }, [alarmTime, isAlarmEnabled, isAlarmRinging]);

  useEffect(() => {
    const handleSkip = () => handleGlobalStageComplete();
    const handleTestSound = () => {
      playTone(880, 150, 'square');
      setTimeout(() => playTone(880, 150, 'square'), 200);
      setTimeout(() => playTone(880, 150, 'square'), 400);
    };
    window.addEventListener('studyflow-timer-skip', handleSkip);
    window.addEventListener('studyflow-test-sound', handleTestSound);
    return () => {
      window.removeEventListener('studyflow-timer-skip', handleSkip);
      window.removeEventListener('studyflow-test-sound', handleTestSound);
    };
  }, [timerState]);

  // New persistent states for analytics decoupling and goals
  const [persistentAnalytics, setPersistentAnalytics] = useState<Record<string, {focus: number, break: number}>>(() => {
    const saved = localStorage.getItem('studyflow_persistent_analytics_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [persistentFocusHistory, setPersistentFocusHistory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('studyflow_focus_history_v1');
    return saved ? JSON.parse(saved) : {};
  });

  const [subjectGoals, setSubjectGoals] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('studyflow_subject_goals_v2');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('studyflow_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('studyflow_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('studyflow_sessions', JSON.stringify(sessions));
    
    // Seed persistent analytics if empty and we have sessions (one-time migration)
    if (Object.keys(persistentAnalytics).length === 0 && sessions.length > 0) {
      const initial: Record<string, {focus: number, break: number}> = {};
      sessions.forEach(s => {
        if (!initial[s.subject]) initial[s.subject] = { focus: 0, break: 0 };
        const secs = s.durationSecs || (s.durationMins * 60);
        if (s.type === 'break') initial[s.subject].break += secs;
        else initial[s.subject].focus += secs;
      });
      setPersistentAnalytics(initial);
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('studyflow_persistent_analytics_v2', JSON.stringify(persistentAnalytics));
  }, [persistentAnalytics]);

  useEffect(() => {
    localStorage.setItem('studyflow_subject_goals_v2', JSON.stringify(subjectGoals));
  }, [subjectGoals]);

  useEffect(() => {
    localStorage.setItem('studyflow_focus_history_v1', JSON.stringify(persistentFocusHistory));
  }, [persistentFocusHistory]);

  useEffect(() => {
    if (alarmTime) localStorage.setItem('studyflow_alarm_time', alarmTime);
    else localStorage.removeItem('studyflow_alarm_time');
  }, [alarmTime]);

  useEffect(() => {
    localStorage.setItem('studyflow_alarm_enabled', isAlarmEnabled.toString());
  }, [isAlarmEnabled]);

  // Global Alarm Check
  useEffect(() => {
    const checkAlarm = () => {
      if (!isAlarmEnabled || !alarmTime) return;

      const now = new Date();
      const currentHHmm = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Reset trigger state if time has changed (different minute)
      if (hasAlarmTriggeredToday && currentHHmm !== alarmTime) {
        setHasAlarmTriggeredToday(false);
      }

      if (currentHHmm === alarmTime && !hasAlarmTriggeredToday) {
        setHasAlarmTriggeredToday(true);
        window.dispatchEvent(new CustomEvent('studyflow-alarm-trigger', { detail: { time: alarmTime } }));
      }
    };

    const interval = setInterval(checkAlarm, 1000);
    return () => clearInterval(interval);
  }, [isAlarmEnabled, alarmTime, hasAlarmTriggeredToday]);

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task && !task.completed) {
        bumpStreak();
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-20 md:pb-0 md:pl-0">
      {!user.onboarded ? (
        <OnboardingView user={user} setUser={setUser} />
      ) : (
        <>
          {/* Top Bar */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-surface-container-high sticky top-0 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('home')}>
            <div className="bg-primary p-1.5 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">StudyFlow</h1>
          </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-1 bg-surface-container rounded-full p-1">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Tasks
            </button>
            <button 
              onClick={() => setActiveTab('study')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'study' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Study
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'notes' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Notes
            </button>
          </nav>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all shadow-sm ${activeTab === 'profile' ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-surface-container-high hover:border-primary/50'}`}
          >
            <img 
              src={user.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView tasks={tasks} userName={user.name} persistentFocusHistory={persistentFocusHistory} sessions={sessions} setActiveTab={setActiveTab} streak={user.streak} />}
          {activeTab === 'tasks' && <TasksView tasks={tasks} toggleTask={toggleTask} setTasks={setTasks} bumpStreak={bumpStreak} />}
          {activeTab === 'study' && (
            <StudyView 
              sessions={sessions} 
              setSessions={setSessions} 
              user={user} 
              setUser={setUser} 
              alarmTime={alarmTime}
              setAlarmTime={setAlarmTime}
              isAlarmEnabled={isAlarmEnabled}
              setIsAlarmEnabled={setIsAlarmEnabled}
              persistentAnalytics={persistentAnalytics}
              setPersistentAnalytics={setPersistentAnalytics}
              subjectGoals={subjectGoals}
              setSubjectGoals={setSubjectGoals}
              timerState={timerState}
              setTimerState={setTimerState}
              showNote={showNote}
              initAudio={initAudio}
            />
          )}
          {activeTab === 'notes' && <NotepadView notes={notes} setNotes={setNotes} bumpStreak={bumpStreak} sessions={sessions} subjectGoals={subjectGoals} />}
          {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} persistentAnalytics={persistentAnalytics} />}
        </AnimatePresence>
      </main>

      {/* Global Notifications */}
      <AnimatePresence>
        {isAlarmRinging && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-8"
            >
              <div className="w-24 h-24 bg-error text-white rounded-full flex items-center justify-center mx-auto animate-pulse shadow-xl shadow-error/20">
                <Bell className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-3xl font-display text-primary mb-2">Wake Up!</h3>
                <p className="text-on-surface-variant font-medium">Your scheduled study alarm is active. Time to get back into the flow!</p>
              </div>
              <button 
                onClick={() => setIsAlarmRinging(false)}
                className="w-full py-5 bg-primary text-white font-display text-xl rounded-2xl shadow-lg hover:bg-indigo-600 transition-colors"
              >
                STOP ALARM
              </button>
            </motion.div>
          </div>
        )}

        {sessionSummary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-display text-on-surface">Session Complete!</h3>
                  <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px]">Great work on your {sessionSummary.subject} study</p>
                </div>

                <div className="bg-surface-container/50 p-6 rounded-[2.5rem] grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-surface-container-high/50">
                    <span className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Time Studied</span>
                    <span className="text-2xl font-display text-primary">
                      {Math.floor(sessionSummary.totalSecs / 3600)}h {Math.floor((sessionSummary.totalSecs % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Points Gained</span>
                    <span className="text-2xl font-display text-secondary">+{Math.floor(sessionSummary.totalSecs / 60)} XP</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                        setSessionSummary(null);
                        setActiveTab('home');
                    }}
                    className="w-full py-4 bg-primary text-white font-display rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    View Analytics
                  </button>
                  <button 
                    onClick={() => setSessionSummary(null)}
                    className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border ${
              notification.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
              notification.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' :
              'bg-primary/90 border-primary/20 text-white'
            }`}
          >
            {notification.type === 'success' && <div className="p-1 bg-white/20 rounded-full"><Trophy className="w-4 h-4" /></div>}
            <span className="text-sm font-bold tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-surface-container-high px-4 flex items-center justify-between z-50">
        <NavButton icon={LayoutDashboard} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={CheckCircle2} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <NavButton icon={Timer} label="Study" active={activeTab === 'study'} onClick={() => setActiveTab('study')} />
        <NavButton icon={StickyNote} label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
        <NavButton icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
        </>
      )}
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary' : 'text-on-surface-variant'}`}
    >
      <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-surface-container text-primary' : ''}`}>
        <Icon className={`w-6 h-6 ${active ? 'fill-primary/20' : ''}`} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ViewWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

function HomeView({ tasks, userName, sessions, persistentFocusHistory, setActiveTab, streak }: { tasks: Task[], userName: string, sessions: StudySession[], persistentFocusHistory: Record<string, number>, setActiveTab: (tab: string) => void, streak: number }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const banners = [
    { 
      title: `Welcome back, ${userName.split(' ')[0]}`, 
      subtitle: "Ready to enter your flow state today?" 
    },
    { 
      title: "The only way to do great work is to love what you do.", 
      subtitle: "- Steve Jobs" 
    },
    { 
      title: "Success is not final, failure is not fatal.", 
      subtitle: "It is the courage to continue that counts. - Winston Churchill" 
    },
    { 
      title: "The secret of getting ahead is getting started.", 
      subtitle: "- Mark Twain" 
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const priorityTasks = tasks.filter(t => !t.completed && t.priority === 'high').slice(0, 3);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Still show total focus across all time
  const totalFocusSecs = Object.values(persistentFocusHistory).reduce((acc, curr) => acc + curr, 0);
  // Total focus hours logic removed from display if unused, but keeping the calculation for now
  
  // Weekly analytics processing
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyTotals = last7Days.map(date => persistentFocusHistory[date] || 0);

  const maxDaily = Math.max(...dailyTotals, 1);
  const averageFocusSecs = dailyTotals.reduce((a, b) => a + b, 0) / 7;
  const averageFocusHrs = (averageFocusSecs / 3600).toFixed(1);

  return (
    <ViewWrapper>
      <section className="min-h-[100px] mb-2 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            <h2 className="text-xl md:text-2xl font-display text-primary mb-1 leading-tight">{banners[bannerIndex].title}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{banners[bannerIndex].subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focus Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between overflow-hidden relative">
          <div className="z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-surface-container px-3 py-1 rounded-full inline-block mb-3">Total Focus Time</span>
            <div className="flex items-baseline gap-1">
              <h3 className="text-5xl font-display text-primary">{averageFocusHrs}</h3>
              <span className="text-lg text-on-surface-variant">hrs avg</span>
            </div>
            <p className="text-sm text-secondary font-medium mt-1">Daily average this week</p>
          </div>
          <div className="mt-8 flex items-end gap-1.5 h-24">
            {dailyTotals.map((secs, i) => {
              const height = (secs / maxDaily) * 100;
              const dayLabel = new Date(last7Days[i]).toLocaleDateString(undefined, { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                  <span className={`text-[8px] font-bold mb-1 transition-opacity ${secs > 0 ? 'opacity-100' : 'opacity-0'} ${i === 6 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {(secs / 3600).toFixed(1)}h
                  </span>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-700 relative ${i === 6 ? 'bg-primary shadow-sm shadow-primary/20' : 'bg-surface-container group-hover/bar:bg-primary/20'}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[8px] font-black uppercase text-on-surface-variant tracking-tighter mt-1">{dayLabel[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-tertiary-fixed rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Flame className="w-10 h-10 text-tertiary fill-tertiary" />
          </div>
          <h3 className="text-3xl font-display text-tertiary">{streak} Days</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-on-tertiary-container mt-1">Tasks Streak</p>
        </div>
      </div>

      {/* Task Box (Priority Tasks + Task Bar) */}
      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-surface-container-high space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-display text-primary">Priority Tasks</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Top things to focus on next</p>
          </div>
          <button onClick={() => setActiveTab('tasks')} className="text-sm font-bold text-primary px-4 py-2 bg-surface-container rounded-full hover:bg-primary/10 transition-colors">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {priorityTasks.length > 0 ? (
            priorityTasks.map(task => (
              <TaskCard key={`priority-home-${task.id}`} task={task} />
            ))
          ) : (
            <div className="bg-surface-container/30 rounded-2xl p-6 text-center border border-dashed border-surface-container-high">
              <p className="text-sm text-on-surface-variant font-medium">All priorities cleared! 🌟</p>
            </div>
          )}
        </div>

        {/* Task Bar Section */}
        <div className="pt-4 border-t border-surface-container-high">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Task Progress</h4>
              <p className="text-[10px] text-on-surface-variant font-bold mt-0.5 uppercase tracking-tighter">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
            <span className="text-xl font-display text-primary">{taskProgress}%</span>
          </div>
          <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${taskProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.3)]" 
            />
          </div>
        </div>
      </section>

      {/* Start Session Button */}
      <button 
        onClick={() => setActiveTab('study')}
        className="w-full bg-primary text-white font-bold py-5 rounded-3xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        <Timer className="w-6 h-6" />
        <span className="text-xl font-display">Start Study Session</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </ViewWrapper>
  );
}

function TaskCard({ task, onToggle }: { task: Task, onToggle?: () => void, key?: React.Key }) {
  return (
    <div className="group bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-surface-container-high transition-all flex items-center gap-4">
      <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shrink-0 text-primary">
        {task.category === 'Mathematics' && <Zap className="w-6 h-6" />}
        {task.category === 'History' && <BookOpen className="w-6 h-6" />}
        {task.category === 'Science' && <Timer className="w-6 h-6" />}
        {task.category === 'Physics' && <Bolt className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text font-semibold text-on-surface truncate ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            task.category === 'Mathematics' ? 'bg-indigo-50 text-primary' : 
            task.category === 'History' ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-tertiary-fixed text-tertiary'
          }`}>
            {task.category}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> 
            {task.time || task.dueDate}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="block font-display text-xl text-tertiary-container">{task.durationMins}</span>
        <span className="block text-[10px] font-bold text-on-surface-variant uppercase">mins</span>
      </div>
    </div>
  );
}

function TasksView({ tasks, toggleTask, setTasks, bumpStreak }: { tasks: Task[], toggleTask: (id: string) => void, setTasks: React.Dispatch<React.SetStateAction<Task[]>>, bumpStreak: () => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Revision');
  const [customCategory, setCustomCategory] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const categoryToSave = newCategory === 'Other' ? (customCategory || 'Other') : newCategory;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      category: categoryToSave,
      dueDate: newDueDate,
      durationMins: 30, // Default duration
      completed: false,
      priority: 'medium'
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDueDate('');
    setCustomCategory('');
    setNewCategory('Revision');
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setDeletingId(null);
  };

  const upcomingTasksByCategory = tasks.reduce((acc, task) => {
    if (!task.completed) {
      acc[task.category] = (acc[task.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Simple Month Calendar Logic
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const taskDates = tasks.filter(t => t.dueDate).map(t => t.dueDate);

  return (
    <ViewWrapper>
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-primary mb-2">Delete Task?</h3>
                <p className="text-on-surface-variant text-sm">Are you sure you want to permanently delete this completed task? This action cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(deletingId)}
                  className="w-full py-4 bg-error text-yellow-300 font-display rounded-2xl shadow-lg hover:bg-red-600 transition-colors"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display text-primary mb-1">Tasks Workspace</h2>
          <p className="text-on-surface-variant">Stay in the flow, one item at a time.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-container px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 text-on-secondary-container fill-on-secondary-container" />
          <span className="text-xs font-bold text-on-secondary-container">Tasks streak: 5 Days</span>
        </div>
      </section>

      {/* Summary Box */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(upcomingTasksByCategory).length > 0 ? (
          Object.entries(upcomingTasksByCategory).map(([cat, count]) => (
            <div key={`upcoming-${cat}`} className="bg-white p-4 rounded-2xl border border-surface-container-high shadow-sm flex flex-col justify-center text-center">
              <span className="text-2xl font-display text-primary">{count}</span>
              <span className="text-[10px] font-bold uppercase text-on-surface-variant truncate">{cat}</span>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-surface-container/30 p-4 rounded-2xl border border-dashed border-surface-container-high text-center">
            <p className="text-xs font-bold text-on-surface-variant uppercase">No upcoming tasks</p>
          </div>
        )}
      </section>

      <form onSubmit={handleAddTask} className="bg-white p-6 rounded-3xl shadow-sm border border-surface-container-high space-y-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-surface-container-low border border-transparent focus:border-primary/20 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Category</label>
              <select 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent focus:border-primary/20 rounded-2xl py-3 px-4 text-sm focus:outline-none transition-all appearance-none"
              >
                <option value="Revision">Revision</option>
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
                <option value="Project">Project</option>
                <option value="Assignment">Assignment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {newCategory === 'Other' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Custom Category</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lab work" 
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/20 rounded-2xl py-3 px-4 text-sm focus:outline-none transition-all"
                />
              </div>
            )}
            
            <div className={`space-y-1 ${newCategory !== 'Other' ? 'md:col-span-2' : ''}`}>
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Deadline Date</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input 
                  type="date" 
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/20 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-primary text-white font-display py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Task
          </button>
        </div>
      </form>

      {/* Timetable / Calendar */}
      <section className="bg-white p-6 rounded-3xl border border-surface-container-high shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-primary">Deadline Timetable</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear -1); }
              else { setCurrentMonth(currentMonth - 1); }
            }} className="p-2 hover:bg-surface-container rounded-full"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-sm font-bold w-32 text-center">{monthNames[currentMonth]} {currentYear}</span>
            <button onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
              else { setCurrentMonth(currentMonth + 1); }
            }} className="p-2 hover:bg-surface-container rounded-full"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={`${d}-${i}`} className="text-[10px] font-bold text-on-surface-variant uppercase">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const hasTask = taskDates.includes(dateStr);
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            return (
              <div 
                key={day} 
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
                  isToday ? 'bg-primary text-white' : hasTask ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {day}
                {hasTask && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-secondary rounded-full" />}
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-2">
        {tasks.map(task => (
          <div 
            key={`task-list-item-${task.id}`} 
            className={`flex items-center gap-4 bg-white p-4 rounded-2xl border transition-all ${task.completed ? 'opacity-60 border-transparent shadow-none' : 'border-transparent shadow-sm hover:border-surface-container-high'}`}
          >
            <button 
              onClick={() => toggleTask(task.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-secondary border-secondary' : 'border-outline group-hover:border-primary'}`}
            >
              {task.completed && <CircleCheck className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-on-surface truncate ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.completed ? 'bg-surface-container text-on-surface-variant' : 'bg-surface-container text-primary'}`}>
                  {task.category}
                </span>
                {(task.time || task.dueDate) && (
                  <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.time || task.dueDate}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!task.completed && (
                <button 
                  onClick={() => {
                    const nextPriority = task.priority === 'high' ? 'medium' : 'high';
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: nextPriority } : t));
                  }}
                  className={`p-2 rounded-xl transition-all ${task.priority === 'high' ? 'bg-tertiary-fixed text-tertiary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
                  title={task.priority === 'high' ? "Remove from Priority" : "Add to Priority"}
                >
                  <Bolt className={`w-5 h-5 ${task.priority === 'high' ? 'fill-tertiary' : ''}`} />
                </button>
              )}
              
              {task.completed && (
                <button 
                  onClick={() => setDeletingId(task.id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all"
                  title="Delete Task"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ViewWrapper>
  );
}
function StudyView({ 
  sessions, setSessions, user, setUser, 
  alarmTime, setAlarmTime, isAlarmEnabled, setIsAlarmEnabled,
  persistentAnalytics, setPersistentAnalytics,
  subjectGoals, setSubjectGoals,
  timerState, setTimerState,
  showNote, initAudio
}: { 
  sessions: StudySession[], 
  setSessions: React.Dispatch<React.SetStateAction<StudySession[]>>,
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  alarmTime: string | null,
  setAlarmTime: React.Dispatch<React.SetStateAction<string | null>>,
  isAlarmEnabled: boolean,
  setIsAlarmEnabled: React.Dispatch<React.SetStateAction<boolean>>,
  persistentAnalytics: Record<string, {focus: number, break: number}>,
  setPersistentAnalytics: React.Dispatch<React.SetStateAction<Record<string, {focus: number, break: number}>>>,
  subjectGoals: Record<string, number>,
  setSubjectGoals: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  timerState: any,
  setTimerState: React.Dispatch<React.SetStateAction<any>>,
  showNote: (message: string, type?: 'success' | 'info' | 'warning') => void,
  initAudio: () => void
}) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const banners = [
    { 
      title: "Flow State Awaits", 
      subtitle: "Focus is a muscle. The more you use it, the stronger it gets." 
    },
    { 
      title: "Time is what we want most, but what we use worst.", 
      subtitle: "- William Penn" 
    },
    { 
      title: "Lost time is never found again.", 
      subtitle: "- Benjamin Franklin" 
    },
    { 
      title: "Don't watch the clock; do what it does. Keep going.", 
      subtitle: "- Sam Levenson" 
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deletingSubjectName, setDeletingSubjectName] = useState<string | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showAlarmSetter, setShowAlarmSetter] = useState(false);

  // Derived from global timerState
  const { workH, workM, workS, breakH, breakM, breakS, timeLeft, isActive, selectedSubject, stage, breakFraction } = timerState;

  const wt = (Number(workH) || 0) * 3600 + (Number(workM) || 0) * 60 + (Number(workS) || 0);
  const bt = (Number(breakH) || 0) * 3600 + (Number(breakM) || 0) * 60 + (Number(breakS) || 0);
  
  const effectiveWt = Math.max(wt, 2); 
  const effectiveBt = bt;

  const t1 = bt > 0 ? Math.floor(effectiveWt * breakFraction) : effectiveWt;
  const t2 = effectiveWt - t1;

  const totalTime = stage === 'break' ? Math.max(effectiveBt, 1) : (stage === 'work-1' ? t1 : t2);
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    initAudio();
    if (wt < 2 && (stage === 'work-1' || stage === 'work-2')) return alert("Please set a work duration of at least 2 seconds.");
    if (bt < 1 && stage === 'break') return alert("Please set a break duration of at least 1 second.");
    setTimerState(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: false, stage: 'work-1', timeLeft: t1 }));
  };

  const [newGoalSubject, setNewGoalSubject] = useState('');
  const [newGoalHours, setNewGoalHours] = useState('');
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);

  const handleAddGoal = () => {
    if (!newGoalSubject.trim()) return;
    const hours = parseFloat(newGoalHours);
    setSubjectGoals(prev => ({
      ...prev,
      [newGoalSubject.trim()]: isNaN(hours) ? 0 : hours
    }));
    setNewGoalSubject('');
    setNewGoalHours('');
    setShowAddGoalForm(false);
    showNote(`Goal added for ${newGoalSubject}`, 'success');
  };

  const removeGoal = (subj: string) => {
    setSubjectGoals(prev => {
      const next = { ...prev };
      delete next[subj];
      return next;
    });
  };

  const subjectTotals = Object.entries(persistentAnalytics).reduce((acc, [subject, data]) => {
    acc[subject] = data.focus;
    return acc;
  }, {} as Record<string, number>);

  const breakTotals = Object.entries(persistentAnalytics).reduce((acc, [subject, data]) => {
    acc[subject] = data.break;
    return acc;
  }, {} as Record<string, number>);

  const sortedSubjects = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  const formatPreciseTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const existingSubjects = Array.from(new Set(sessions.map(s => s.subject)));
  const defaultSubjects = ['Mathematics', 'Biology', 'History', 'Physics', 'Computer Sc.', 'Chemistry', 'Literature', 'General'];
  const allSuggestedSubjects = Array.from(new Set([...defaultSubjects, ...existingSubjects]));

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setDeletingSessionId(null);
  };

  const handleDeleteSubject = (subjectName: string) => {
    setSessions(prev => prev.filter(s => s.subject !== subjectName));
    setPersistentAnalytics(prev => {
      const next = { ...prev };
      delete next[subjectName];
      return next;
    });
    setSubjectGoals(prev => {
      const next = { ...prev };
      delete next[subjectName];
      return next;
    });
    setDeletingSubjectName(null);
  };

  return (
    <ViewWrapper>
      <AnimatePresence>
        {showSkipConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-primary mb-2">Skip this stage?</h3>
                <p className="text-on-surface-variant text-sm">You are manually advancing the timer to the next session stage.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    // Logic to skip stage - we'll trigger global completion
                    window.dispatchEvent(new Event('studyflow-timer-skip'));
                    setShowSkipConfirm(false);
                  }}
                  className="w-full py-4 bg-primary text-white font-display rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Yes, Skip Stage
                </button>
                <button 
                  onClick={() => setShowSkipConfirm(false)}
                  className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAlarmSetter && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display text-primary">Set Device Alarm</h3>
                <p className="text-on-surface-variant text-sm px-4">Schedule a notification and sound for a specific time of day.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <input 
                    type="time" 
                    value={alarmTime || ''}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="w-full text-4xl font-display text-primary text-center bg-surface-container py-6 rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                  />
                  <div className="mt-4 flex items-center gap-3 w-full p-4 bg-surface-container/50 rounded-2xl">
                    <div className="flex items-center h-5">
                      <input 
                        id="alarm-enabled"
                        type="checkbox" 
                        checked={isAlarmEnabled}
                        onChange={(e) => setIsAlarmEnabled(e.target.checked)}
                        className="w-5 h-5 accent-primary rounded-lg cursor-pointer"
                      />
                    </div>
                    <label htmlFor="alarm-enabled" className="text-sm font-bold text-on-surface-variant cursor-pointer flex-1">
                      Alarm Enabled
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    // Test sound via global helper
                    window.dispatchEvent(new CustomEvent('studyflow-test-sound'));
                    showNote("Testing Alarm Beep...", 'info');
                  }}
                  className="w-full py-2 text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
                >
                  Test Alarm Sound
                </button>
                <button 
                  onClick={() => {
                    setShowAlarmSetter(false);
                    if (isAlarmEnabled && alarmTime) {
                      showNote(`Alarm scheduled for ${alarmTime}`, 'success');
                    }
                  }}
                  className="w-full py-4 bg-primary text-white font-display rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save Alarm
                </button>
                <button 
                  onClick={() => {
                    setAlarmTime(null);
                    setIsAlarmEnabled(false);
                    setShowAlarmSetter(false);
                  }}
                  className="w-full py-3 text-error border-2 border-transparent hover:border-error/20 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
                >
                   Clear Alarm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Study UI Render Using global timerState */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-display text-primary mb-1">Study Flow</h2>
            <p className="text-on-surface-variant font-medium">Elevate your focus session.</p>
          </div>
          <button 
            onClick={() => setShowAlarmSetter(true)}
            className={`p-4 rounded-[2rem] transition-all hover:scale-105 active:scale-95 ${alarmTime && isAlarmEnabled ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <Bell className={`w-7 h-7 ${alarmTime && isAlarmEnabled ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        <section className="min-h-[100px] mb-2 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col justify-center"
            >
              <h2 className="text-xl md:text-2xl font-display text-primary mb-1 leading-tight">{banners[bannerIndex].title}</h2>
              <p className="text-sm text-on-surface-variant font-medium">{banners[bannerIndex].subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="space-y-8">
          {/* TOP: Subject & Timing Selection */}
          <div className="bg-white p-8 rounded-[3rem] border border-surface-container-high shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Subject Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="text-[12px] font-black uppercase text-on-surface-variant tracking-[0.2em]">Study Subject</h4>
                </div>
                <input 
                  type="text"
                  placeholder="e.g. Quantum Physics..."
                  value={selectedSubject}
                  onChange={(e) => setTimerState(prev => ({ ...prev, selectedSubject: e.target.value }))}
                  disabled={isActive}
                  className="w-full bg-surface-container border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 font-display text-lg outline-none transition-all disabled:opacity-50"
                  list="subjects-datalist"
                />
                <datalist id="subjects-datalist">
                  {Array.from(new Set([...Object.keys(subjectGoals), 'General', 'Mathematics', 'Biology', 'History', 'Physics'])).map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Session Split / Break Placement */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h4 className="text-[12px] font-black uppercase text-on-surface-variant tracking-[0.2em]">Break Timing</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Early', val: 0.25 },
                    { label: 'Mid', val: 0.5 },
                    { label: 'Late', val: 0.75 },
                    { label: 'None', val: 1.0 }
                  ].map(f => (
                    <button
                      key={`fraction-${f.val}`}
                      onClick={() => setTimerState(prev => ({ ...prev, breakFraction: f.val, timeLeft: f.val === 1 ? effectiveWt : Math.floor(effectiveWt * f.val) }))}
                      disabled={isActive}
                      className={`flex-1 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        breakFraction === f.val 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      } disabled:opacity-50 text-center`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Total Session Time</span>
                  <span className="text-xl font-display text-primary">{formatPreciseTime(effectiveWt + effectiveBt)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Focus Ratio</span>
                <span className="text-sm font-bold text-on-surface-variant">{Math.round((effectiveWt / (effectiveWt + (effectiveBt || 1))) * 100)}% Study / {Math.round((effectiveBt / (effectiveWt + (effectiveBt || 1))) * 100)}% Rest</span>
              </div>
            </div>
          </div>

          {/* MIDDLE: Timer Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-surface-container-high shadow-sm">
            {/* Work Duration Setting */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[12px] font-black uppercase text-primary tracking-[0.2em]">Work Duration</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Focus Goal</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={workH} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, workH: val === '' ? '' : Math.max(0, parseInt(val) || 0).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-primary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Hrs</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={workM} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, workM: val === '' ? '' : Math.max(0, Math.min(59, parseInt(val) || 0)).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-primary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Min</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={workS} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, workS: val === '' ? '' : Math.max(0, Math.min(59, parseInt(val) || 0)).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-primary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Sec</span>
                </div>
              </div>
            </div>

            {/* Break Duration Setting */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[12px] font-black uppercase text-secondary tracking-[0.2em]">Break Duration</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary/60">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Rest Interval</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={breakH} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, breakH: val === '' ? '' : Math.max(0, parseInt(val) || 0).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-secondary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Hrs</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={breakM} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, breakM: val === '' ? '' : Math.max(0, Math.min(59, parseInt(val) || 0)).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-secondary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Min</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="number" value={breakS} onChange={e => {
                      const val = e.target.value;
                      setTimerState(prev => ({ ...prev, breakS: val === '' ? '' : Math.max(0, Math.min(59, parseInt(val) || 0)).toString() }));
                    }} disabled={isActive}
                    className="bg-surface-container border-2 border-transparent focus:border-secondary/20 rounded-2xl py-2 text-center font-display text-lg outline-none transition-all disabled:opacity-30"
                  />
                  <span className="text-[10px] font-black text-on-surface-variant/40 text-center uppercase tracking-widest">Sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actual Timer (BELOW) */}
          <div id="study-timer-section" className="bg-white p-10 md:p-16 rounded-[4rem] shadow-sm border border-surface-container-high relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8">
                <span className={`text-[12px] font-black uppercase tracking-[0.25em] px-6 py-2 rounded-full shadow-sm ${
                  stage === 'work-1' ? 'bg-primary text-white' : 
                  stage === 'break' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 
                  'bg-primary-container text-primary font-bold'
                }`}>
                  {stage === 'break' ? 'Rest Mode' : (stage === 'work-1' ? 'Main Focus' : 'Extended Focus')}
                </span>
              </div>

              <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform">
                  <circle
                    cx="50%" cy="50%" r="46%"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-surface-container/50"
                  />
                  <motion.circle
                    cx="50%" cy="50%" r="46%"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="100 100"
                    pathLength="100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - progress }}
                    transition={{ duration: 1, ease: "linear" }}
                    className={stage === 'break' ? "text-secondary" : "text-primary"}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-7xl md:text-8xl font-display text-on-surface tracking-tighter leading-none">
                    {formatTime(timeLeft)}
                  </span>
                  <div className="flex flex-col items-center mt-4">
                    <button 
                      onClick={() => setShowSkipConfirm(true)}
                      className="text-[11px] font-black tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 group/skip"
                    >
                      SKIP STAGE <ChevronRight className="w-4 h-4 group-hover/skip:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 mt-12">
                <button 
                  onClick={resetTimer}
                  className="p-5 bg-surface-container text-on-surface-variant rounded-3xl hover:bg-surface-container-high transition-all active:scale-95 hover:text-primary"
                  title="Reset Counter"
                >
                  <RotateCcw className="w-7 h-7" />
                </button>
                <button 
                  onClick={toggleTimer}
                  className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 relative ${
                    isActive ? 'bg-surface-container text-on-surface' : 'bg-primary text-white hover:scale-105 hover:shadow-primary/30'
                  }`}
                >
                  {isActive ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 ml-2" />}
                </button>
                <div className="w-16 h-16" /> {/* Balance spacer */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {/* Goal Board */}
        <section className="bg-gradient-to-br from-primary to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-display mb-1 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-300" /> Student Goal Board
                </h3>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.15em]">Track your focus targets</p>
              </div>
              <button 
                onClick={() => setShowAddGoalForm(!showAddGoalForm)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
                title="Add New Target"
              >
                {showAddGoalForm ? <ChevronDown className="w-5 h-5 rotate-180 transition-transform" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {showAddGoalForm && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-8 bg-white/10 p-5 rounded-3xl border border-white/20 shadow-2xl space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text"
                          placeholder="Subject Name (e.g. Physics)"
                          list="goalSubjectsList"
                          value={newGoalSubject}
                          onChange={(e) => setNewGoalSubject(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-blue-200/50"
                        />
                        <datalist id="goalSubjectsList">
                          {allSuggestedSubjects.map(s => <option key={`goal-opt-${s}`} value={s} />)}
                        </datalist>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          placeholder="Hrs"
                          value={newGoalHours}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewGoalHours(val === '' ? '' : Math.max(0, parseFloat(val) || 0).toString());
                          }}
                          className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-blue-200/50"
                        />
                        <button 
                          onClick={handleAddGoal}
                          className="bg-secondary text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95"
                        >
                          Set Goal
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(subjectGoals).length === 0 && !showAddGoalForm && (
                <div className="py-12 text-center">
                   <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Target className="w-8 h-8 text-blue-200" />
                   </div>
                   <p className="text-sm font-medium opacity-80">Drive your studies with targets.</p>
                   <button 
                    onClick={() => setShowAddGoalForm(true)}
                    className="mt-4 text-[10px] uppercase font-black tracking-widest bg-white/10 px-6 py-2 rounded-full hover:bg-white/20 transition-all"
                   >
                     Set Your First Goal
                   </button>
                </div>
              )}
              {Object.keys(subjectGoals).map(subject => {
                const goalHours = subjectGoals[subject] || 0;
                const totalSecs = subjectTotals[subject] || 0;
                const totalHours = totalSecs / 3600;
                const progress = goalHours > 0 ? Math.min(100, (totalHours / goalHours) * 100) : 0;
                
                return (
                  <div 
                    key={`goal-item-${subject}`} 
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/30 transition-all group cursor-pointer"
                    onClick={() => {
                      const overallSecs = goalHours * 3600;
                      const firstStageSecs = timerState.breakFraction < 1 ? Math.floor(overallSecs * timerState.breakFraction) : overallSecs;
                      
                      setTimerState(prev => ({
                        ...prev,
                        selectedSubject: subject,
                        workH: goalHours.toString(),
                        workM: '0',
                        workS: '0',
                        stage: 'work-1',
                        timeLeft: Math.max(firstStageSecs, 1),
                        isActive: true
                      }));
                      showNote(`Focus Session: ${subject} (${goalHours}h target)`, 'success');
                      
                      // Navigate towards the actual timer section
                      setTimeout(() => {
                        document.getElementById('study-timer-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm uppercase tracking-tight">{subject}</h4>
                        <p className="text-[10px] text-blue-100 font-medium mt-1">
                          {formatPreciseTime(totalSecs)} focalized / {goalHours > 0 ? `${goalHours}h goal` : 'Target unset'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="relative group/input" onClick={e => e.stopPropagation()}>
                          <input 
                            type="number"
                            placeholder="Hours"
                            value={goalHours || ''}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value));
                              setSubjectGoals(prev => ({ ...prev, [subject]: isNaN(val) ? 0 : val }));
                            }}
                            className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:bg-white/20 transition-all"
                          />
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase bg-black/40 px-2 py-0.5 rounded opacity-0 group-hover/input:opacity-100 transition-opacity whitespace-nowrap">Edit Hrs</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeGoal(subject); }}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-300 rounded-lg transition-all"
                          title="Remove Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {goalHours > 0 && (
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full rounded-full ${progress === 100 ? 'bg-green-400' : 'bg-secondary'}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display text-primary">Recent Sessions</h3>
          <div className="flex items-center gap-2 bg-tertiary/10 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">{sessions.length} Records</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {sessions.slice(0, 3).map(session => (
            <div key={`history-session-${session.id}`} className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl group hover:bg-white border border-transparent hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.type === 'break' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                  {session.type === 'break' ? <Coffee className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface uppercase tracking-tight">{session.subject}</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">{session.date} • {session.startTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-display ${session.type === 'break' ? 'text-secondary' : 'text-primary'}`}>
                  {session.durationSecs ? formatPreciseTime(session.durationSecs) : `${session.durationMins}m`}
                </span>
                <button 
                  onClick={() => setDeletingSessionId(session.id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="py-8 text-center bg-surface-container/20 rounded-3xl border border-dashed border-surface-container-high opacity-40">
              <p className="text-xs font-bold uppercase tracking-widest">No sessions logged yet</p>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-surface-container-high">
          <div className="bg-white rounded-[3.5rem] border border-surface-container shadow-sm overflow-hidden">
            <div className="p-8 border-b border-surface-container flex items-center justify-between bg-surface-container/10">
              <div>
                <h3 className="text-xl font-display text-primary">Course Focus Leaderboard</h3>
                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1">Ranking your subjects by dedicated study time</p>
              </div>
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4">
              {sortedSubjects.length > 0 ? (
                <div className="space-y-2">
                  {sortedSubjects.map(([subject, totalFocus], index) => (
                    <motion.div 
                      key={`leaderboard-row-${subject}`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="group flex items-center gap-6 p-4 rounded-3xl hover:bg-surface-container transition-all"
                    >
                      {/* Rank Indicator */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg shrink-0 ${
                        index === 0 ? 'bg-secondary/20 text-secondary border-2 border-secondary/20' :
                        index === 1 ? 'bg-on-surface-variant/10 text-on-surface-variant' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-surface-container-high text-on-surface-variant/40'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Subject Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm tracking-tight text-on-surface truncate pr-4">{subject}</h4>
                          <span className="text-sm font-display text-primary whitespace-nowrap">{formatPreciseTime(totalFocus)}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(100, (totalFocus / (sortedSubjects[0][1] || 1)) * 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${index === 0 ? 'bg-secondary' : 'bg-primary/60'}`}
                          />
                        </div>

                        {/* Secondary Stats */}
                        <div className="mt-2 flex items-center gap-4 text-[9px] font-black text-on-surface-variant/30 uppercase tracking-[0.15em]">
                          <span>Efficiency: {totalFocus + (breakTotals[subject]||0) > 0 ? Math.round((totalFocus / (totalFocus + (breakTotals[subject]||0))) * 100) : 0}%</span>
                          <span className="w-1 h-1 rounded-full bg-surface-container-high" />
                          <span>Rest: {formatPreciseTime(breakTotals[subject] || 0)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <button 
                        onClick={() => setDeletingSubjectName(subject)}
                        className="p-3 text-on-surface-variant/10 hover:text-error hover:bg-error/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-on-surface-variant/30">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Launch a study session to build your board</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modals */}
      <AnimatePresence>
        {deletingSessionId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-primary mb-2">Delete Session?</h3>
                <p className="text-on-surface-variant text-sm px-4">This record will be removed from your history. This cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteSession(deletingSessionId)}
                  className="w-full py-4 bg-primary text-white font-display rounded-2xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setDeletingSessionId(null)}
                  className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                >
                  Keep Record
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {deletingSubjectName && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-primary mb-2 text-wrap">Reset Subject Data?</h3>
                <p className="text-on-surface-variant text-sm px-4 italic font-bold text-error mb-2">"{deletingSubjectName}"</p>
                <p className="text-on-surface-variant text-xs px-2">Deleting this subject will remove ALL its associated sessions and accumulated focus/break analytics. This action is final.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteSubject(deletingSubjectName)}
                  className="w-full py-4 bg-error text-white font-display rounded-2xl shadow-lg hover:bg-red-600 transition-colors"
                >
                  Destructive Reset
                </button>
                <button 
                  onClick={() => setDeletingSubjectName(null)}
                  className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}

function NotepadView({ notes, setNotes, bumpStreak, sessions, subjectGoals }: { notes: Note[], setNotes: React.Dispatch<React.SetStateAction<Note[]>>, bumpStreak: () => void, sessions: StudySession[], subjectGoals: Record<string, number> }) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const defaultSubjects = ['Mathematics', 'Biology', 'History', 'Physics', 'Computer Sc.', 'Chemistry', 'Literature', 'General'];
  const sessionSubjects = Array.from(new Set(sessions.map(s => s.subject)));
  const goalSubjects = Object.keys(subjectGoals);
  const allSubjects = Array.from(new Set([...defaultSubjects, ...sessionSubjects, ...goalSubjects]));

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      subject: 'General',
      updatedAt: 'Just now'
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const handleCloseNote = () => {
    if (selectedNote) {
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...selectedNote, updatedAt: 'Just now' } : n));
      setSelectedNote(null);
    }
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingNoteId(id);
  };

  const confirmDeleteNote = () => {
    if (deletingNoteId) {
      setNotes(prev => prev.filter(n => n.id !== deletingNoteId));
      if (selectedNote?.id === deletingNoteId) {
        setSelectedNote(null);
      }
      setDeletingNoteId(null);
    }
  };

  const getNoteColor = (subject: string, id: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-100 border-blue-200 text-blue-900',
      'Biology': 'bg-green-100 border-green-200 text-green-900',
      'History': 'bg-amber-100 border-amber-200 text-amber-900',
      'Physics': 'bg-purple-100 border-purple-200 text-purple-900',
      'Computer Sc.': 'bg-slate-100 border-slate-200 text-slate-900',
      'Chemistry': 'bg-emerald-100 border-emerald-200 text-emerald-900',
      'Literature': 'bg-rose-100 border-rose-200 text-rose-900',
      'General': 'bg-orange-100 border-orange-200 text-orange-900',
    };
    
    if (colors[subject]) return colors[subject];
    
    // Random color based on ID for custom subjects
    const colorOptions = [
      'bg-cyan-100 border-cyan-200 text-cyan-900',
      'bg-teal-100 border-teal-200 text-teal-900',
      'bg-lime-100 border-lime-200 text-lime-900',
      'bg-pink-100 border-pink-200 text-pink-900',
      'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-900',
      'bg-yellow-100 border-yellow-200 text-yellow-900'
    ];
    const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorOptions[charCodeSum % colorOptions.length];
  };

  const getNoteTagStyle = (subject: string) => {
    const styles: Record<string, string> = {
      'Mathematics': 'bg-blue-400/20 text-blue-800',
      'Biology': 'bg-green-400/20 text-green-800',
      'History': 'bg-amber-400/20 text-amber-800',
      'Physics': 'bg-purple-400/20 text-purple-800',
      'Computer Sc.': 'bg-slate-400/20 text-slate-800',
      'Chemistry': 'bg-emerald-400/20 text-emerald-800',
      'Literature': 'bg-rose-400/20 text-rose-800',
      'General': 'bg-orange-400/20 text-orange-800',
    };
    return styles[subject] || 'bg-gray-400/20 text-gray-800';
  };

  if (selectedNote) {
    const cardStyles = getNoteColor(selectedNote.subject, selectedNote.id);
    const rotation = (selectedNote.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 4) - 2;

    return (
      <ViewWrapper>
        <AnimatePresence>
          {deletingNoteId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6"
              >
                <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-display text-primary mb-2">Delete Note?</h3>
                  <p className="text-on-surface-variant text-sm">Are you sure you want to permanently delete this note? This action cannot be undone.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmDeleteNote}
                    className="w-full py-4 bg-error text-white font-display rounded-2xl shadow-lg hover:bg-red-600 transition-colors"
                  >
                    Delete Permanently
                  </button>
                  <button 
                    onClick={() => setDeletingNoteId(null)}
                    className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, rotate: rotation }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className={`${cardStyles} p-8 rounded-[3.5rem] border-2 shadow-2xl min-h-[700px] transition-all duration-500 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={handleCloseNote}
                className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="h-12 bg-error/10 text-error px-6 rounded-2xl font-display text-sm flex items-center gap-2 hover:bg-error hover:text-white transition-all shadow-sm"
                  title="Delete Note"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Note</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <input 
                type="text" 
                value={selectedNote.title}
                onChange={e => setSelectedNote({...selectedNote, title: e.target.value})}
                className="w-full text-4xl font-display bg-transparent focus:outline-none border-b-2 border-current/10 pb-4 placeholder:opacity-30"
                placeholder="Note Title"
              />
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/40 rounded-xl">
                    <Target className="w-4 h-4 text-current" />
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Subject Name"
                      list="noteSubjectsList"
                      value={selectedNote.subject}
                      onChange={e => setSelectedNote({...selectedNote, subject: e.target.value})}
                      className="text-xs font-black uppercase tracking-widest bg-white/40 px-6 py-3 rounded-2xl focus:outline-none border-2 border-transparent focus:border-current/20 w-56 transition-all"
                    />
                    <datalist id="noteSubjectsList">
                      {allSubjects.map(subject => (
                        <option key={`note-subject-opt-${subject}`} value={subject} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-40">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Last updated: {selectedNote.updatedAt}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <textarea 
                  value={selectedNote.content}
                  onChange={e => setSelectedNote({...selectedNote, content: e.target.value})}
                  className="w-full min-h-[450px] text-lg bg-white/20 backdrop-blur-sm p-8 rounded-[2.5rem] focus:outline-none leading-relaxed resize-none border-2 border-transparent focus:border-current/10 transition-all placeholder:opacity-30"
                  placeholder="Start writing your thoughts..."
                />
              </div>
            </div>
          </div>
        </motion.div>
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper>
      <AnimatePresence>
        {deletingNoteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-primary mb-2">Delete Note?</h3>
                <p className="text-on-surface-variant text-sm">Are you sure you want to permanently delete this note? This action cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteNote}
                  className="w-full py-4 bg-red-600 text-white font-display rounded-2xl shadow-lg hover:bg-red-700 transition-colors"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setDeletingNoteId(null)}
                  className="w-full py-2 text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-primary">Notepad</h2>
        <button 
          onClick={handleAddNote}
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 opacity-50">
            <StickyNote className="w-12 h-12 mx-auto" />
            <p className="font-medium">No notes yet. Click the + to create one.</p>
          </div>
        ) : (
          notes.map((note, index) => {
            const cardStyles = getNoteColor(note.subject, note.id);
            const tagStyles = getNoteTagStyle(note.subject);
            // Slight random rotation for "bending" effect
            const rotation = (note.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 4) - 2; // -2 to +1
            
            return (
              <motion.div 
                key={`note-card-view-${note.id}`} 
                initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
                animate={{ opacity: 1, scale: 1, rotate: rotation }}
                whileHover={{ rotate: 0, scale: 1.02, y: -5 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedNote(note)}
                className={`${cardStyles} p-6 rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-60 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-12 -mt-12 blur-3xl opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/40 rounded-2xl shadow-sm">
                      <StickyNote className="w-5 h-5 text-current" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${tagStyles} px-3 py-1.5 rounded-full border border-current/10`}>
                      {note.subject}
                    </span>
                  </div>
                  <h3 className="text-xl font-display leading-tight line-clamp-2">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <p className="text-xs opacity-60 line-clamp-3 mt-3 font-medium leading-relaxed">
                    {note.content || 'Empty note...'}
                  </p>
                </div>
                
                <div className="relative z-10 flex justify-between items-center mt-4">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">
                    {note.updatedAt}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-2 text-current/30 hover:text-error hover:bg-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-2xl bg-white/40 border border-white/50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all font-bold">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </ViewWrapper>
  );
}

function ProfileView({ user, setUser, persistentAnalytics }: { user: UserProfile, setUser: (u: UserProfile) => void, persistentAnalytics: Record<string, {focus: number, break: number}> }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [showCamera, setShowCamera] = useState(false);

  const handleSave = () => {
    setUser(formData);
    setEditing(false);
  };

  const totalFocusSecs = Object.values(persistentAnalytics).reduce((acc, curr) => acc + curr.focus, 0);
  const totalFocusHrs = Math.floor(totalFocusSecs / 3600);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ViewWrapper>
      {showCamera && (
        <CameraCapture 
          onCapture={(img) => {
            setFormData({ ...formData, avatar: img });
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}
      <section className="flex flex-col items-center relative py-4">
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {!editing && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-secondary rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                <Bolt className="w-4 h-4 fill-white" />
              </div>
            )}
          </div>

          {editing && (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCamera(true)}
                className="px-5 py-2.5 bg-white shadow-sm border border-surface-container-high rounded-full text-xs font-bold text-primary flex items-center gap-2 hover:bg-surface-container transition-all"
              >
                <Camera className="w-4 h-4" /> Capture Photo
              </button>
              <label className="px-5 py-2.5 bg-white shadow-sm border border-surface-container-high rounded-full text-xs font-bold text-primary flex items-center gap-2 cursor-pointer hover:bg-surface-container transition-all">
                <UploadCloud className="w-4 h-4" /> Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center space-y-2">
          {editing ? (
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="text-2xl font-display text-primary text-center bg-surface-container rounded-xl px-4 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
            />
          ) : (
            <h2 className="text-3xl font-display text-primary">{user.name}</h2>
          )}
          <div className="flex items-center justify-center gap-2 text-on-surface-variant">
            <Mail className="w-4 h-4" />
            {editing ? (
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="text-sm bg-surface-container rounded-lg px-3 py-1 focus:outline-none"
              />
            ) : (
              <span className="text-sm font-medium">{user.email}</span>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-surface-container-high space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display text-primary uppercase tracking-tight">Personal Details</h3>
            <button 
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${editing ? 'bg-secondary text-white' : 'bg-surface-container text-primary hover:bg-surface-container-high'}`}
            >
              {editing ? <><Save className="w-4 h-4" /> Save</> : <><User className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
                <School className="w-3 h-3" /> Institution
              </label>
              {editing ? (
                <input 
                  type="text" 
                  value={formData.institution} 
                  onChange={e => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full bg-surface-container rounded-xl px-4 py-2 text-sm focus:outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-on-surface bg-surface-container-low p-3 rounded-xl">{user.institution}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Grade / Level
              </label>
              {editing ? (
                <input 
                  type="text" 
                  value={formData.grade} 
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full bg-surface-container rounded-xl px-4 py-2 text-sm focus:outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-on-surface bg-surface-container-low p-3 rounded-xl">{user.grade || 'Not specified'}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
                <LayoutDashboard className="w-3 h-3" /> About Me
              </label>
              {editing ? (
                <textarea 
                  rows={3}
                  value={formData.bio} 
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-surface-container rounded-xl px-4 py-2 text-sm focus:outline-none resize-none"
                />
              ) : (
                <p className="text-sm text-on-surface leading-relaxed bg-surface-container-low p-3 rounded-xl">{user.bio}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </ViewWrapper>
  );
}

function OnboardingView({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [formData, setFormData] = useState(user);
  const [showCamera, setShowCamera] = useState(false);

  const handleComplete = () => {
    if (!formData.name || !formData.email) {
      alert("Please enter your name and email to continue.");
      return;
    }
    setUser({ ...formData, onboarded: true });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-6 bg-surface overflow-y-auto"
    >
      {showCamera && (
        <CameraCapture 
          onCapture={(img) => {
            setFormData({ ...formData, avatar: img });
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[2rem] shadow-xl border border-surface-container-high">
        <div className="text-center space-y-2">
          <div className="bg-primary w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display text-primary">Welcome to StudyFlow</h2>
          <p className="text-on-surface-variant text-sm px-4">Let's set up your profile to start your focus journey.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-5">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-surface-container shadow-md">
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-bold text-primary flex items-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" /> Capture
              </button>
              <label className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-bold text-primary flex items-center gap-2 cursor-pointer transition-all">
                <UploadCloud className="w-4 h-4" /> Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/30 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/30 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Institution</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="University or College" 
                  value={formData.institution}
                  onChange={e => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/30 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Grade / Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="e.g. 10th Grade, Year 2" 
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full bg-surface-container-low border border-transparent focus:border-primary/30 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant ml-2">Bio (Optional)</label>
              <textarea 
                rows={2}
                placeholder="Tell us about your studies..." 
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-surface-container-low border border-transparent focus:border-primary/30 rounded-2xl py-3 px-4 text-sm outline-none transition-all resize-none"
              />
            </div>
          </div>

          <button 
            onClick={handleComplete}
            className="w-full bg-primary text-white font-display py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Get Started <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CameraCapture({ onCapture, onCancel }: { onCapture: (img: string) => void, onCancel: () => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      setLoading(true);
      setError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 720 },
            aspectRatio: { ideal: 1 }
          } 
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setLoading(false);
      } catch (err) {
        console.error("Camera error:", err);
        setLoading(false);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror the image to match the video preview
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden relative shadow-2xl">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-surface-container hover:bg-surface-container-high rounded-full flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5 text-on-surface" />
        </button>

        <div className="p-6 text-center space-y-4">
          <h3 className="text-xl font-display text-primary">Capture Profile Pic</h3>
          
          <div className="aspect-square bg-surface-container rounded-2xl overflow-hidden relative border-2 border-primary/20">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-sm text-error text-center font-medium">
                {error}
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover scale-x-[-1]" 
              />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!error && !loading && (
            <button 
              onClick={handleCapture}
              className="w-full bg-primary text-white font-display py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" /> Take Photo
            </button>
          )}

          <button 
            onClick={onCancel}
            className="w-full text-on-surface-variant font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container py-2 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

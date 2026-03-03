import React, { useState, useEffect, useRef } from 'react';

export default function PomodoroApp() {
  // Phase types: 'input' | 'focus' | 'shortBreak' | 'longBreak' | 'summary'
  const [phase, setPhase] = useState('input');
  const [targetSessions, setTargetSessions] = useState(4);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [restartCount, setRestartCount] = useState(0);
  const [skipBreakCount, setSkipBreakCount] = useState(0);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [nextPhase, setNextPhase] = useState(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  
  const timerRef = useRef(null);

  // ⚠️ TIMER DURATIONS - TESTING MODE ⚠️
  // Current: Fast timers for testing (15s focus, 5s short break, 10s long break)
  // Production: Change to real durations
  //   - FOCUS_TIME = 25 * 60 (25 minutes)
  //   - SHORT_BREAK = 5 * 60 (5 minutes)  
  //   - LONG_BREAK = 15 * 60 (15 minutes)
  
  // Timer durations in seconds (TESTING MODE - fast timers)
  const FOCUS_TIME = 15; // 15 seconds (normally 25 min)
  const SHORT_BREAK = 5; // 5 seconds (normally 5 min)
  const LONG_BREAK = 7; // 7 seconds (normally 15 min)

  // Start Pomodoro session
  const startPomodoro = () => {
    setStartTime(new Date());
    setCompletedSessions(0);
    setRestartCount(0);
    setSkipBreakCount(0);
    setPhase('focus');
    setTimeRemaining(FOCUS_TIME);
    setIsRunning(true);
  };

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
      handlePhaseComplete();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  // Handle phase completion
  const handlePhaseComplete = () => {
    if (phase === 'focus') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      
      if (newCompleted >= targetSessions) {
        // All sessions complete
        setEndTime(new Date());
        setPhase('summary');
      } else {
        // Show transition to break
        const isLongBreak = newCompleted % 4 === 0;
        setNextPhase(isLongBreak ? 'longBreak' : 'shortBreak');
        setShowTransitionModal(true);
      }
    } else {
      // Break complete, transition to focus
      setNextPhase('focus');
      setShowTransitionModal(true);
    }
  };

  // Confirm transition
  const confirmTransition = () => {
    setShowTransitionModal(false);
    
    if (nextPhase === 'focus') {
      setPhase('focus');
      setTimeRemaining(FOCUS_TIME);
    } else if (nextPhase === 'shortBreak') {
      setPhase('shortBreak');
      setTimeRemaining(SHORT_BREAK);
    } else if (nextPhase === 'longBreak') {
      setPhase('longBreak');
      setTimeRemaining(LONG_BREAK);
    }
    
    setIsRunning(true);
  };

  // Restart current session
  const restartSession = () => {
    setRestartCount(prev => prev + 1);
    
    if (phase === 'focus') {
      setTimeRemaining(FOCUS_TIME);
    } else if (phase === 'shortBreak') {
      setTimeRemaining(SHORT_BREAK);
    } else if (phase === 'longBreak') {
      setTimeRemaining(LONG_BREAK);
    }
    
    setIsRunning(true);
  };

  // Stop session (back to input)
  const stopSession = () => {
    setShowStopConfirm(false);
    setIsRunning(false);
    setPhase('input');
    setTargetSessions(4);
  };

  // Skip break
  const skipBreak = () => {
    setShowSkipConfirm(false);
    setSkipBreakCount(prev => prev + 1);
    setPhase('focus');
    setTimeRemaining(FOCUS_TIME);
    setIsRunning(true);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    let total = 0;
    if (phase === 'focus') total = FOCUS_TIME;
    else if (phase === 'shortBreak') total = SHORT_BREAK;
    else if (phase === 'longBreak') total = LONG_BREAK;
    
    return total > 0 ? ((total - timeRemaining) / total) * 100 : 0;
  };

  // Get phase label
  const getPhaseLabel = () => {
    if (phase === 'focus') return 'Focus Time';
    if (phase === 'shortBreak') return 'Short Break';
    if (phase === 'longBreak') return 'Long Break';
    return '';
  };

  // Get phase color (Focus = calming, Break = warming)
  const getPhaseColor = () => {
    if (phase === 'focus') return 'from-emerald-500 to-teal-500'; // Calming green/blue
    if (phase === 'shortBreak') return 'from-amber-400 to-orange-400'; // Warming yellow/orange
    if (phase === 'longBreak') return 'from-yellow-400 to-amber-500'; // Warm yellow
    return 'from-gray-400 to-gray-500';
  };

  // Calculate summary metrics
  const calculateMetrics = () => {
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const actualMinutes = Math.floor(totalSeconds / 60);
    const actualSeconds = totalSeconds % 60;
    
    // Calculate estimated time including breaks
    // Long break after every 4th session (4, 8, 12, ...)
    const longBreakCount = Math.floor(targetSessions / 4);
    const shortBreakCount = targetSessions - longBreakCount;
    const estimatedDuration = Math.round(
      targetSessions * (FOCUS_TIME / 60) + 
      longBreakCount * (LONG_BREAK / 60) + 
      shortBreakCount * (SHORT_BREAK / 60)
    );
    
    const difference = actualMinutes - estimatedDuration;
    
    return {
      actualMinutes,
      actualSeconds,
      actualDuration: actualMinutes, // for backward compatibility
      estimatedDuration,
      difference,
      startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // INPUT SCREEN
  if (phase === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
              POMO
            </h1>
            <p className="text-slate-400 text-lg">Focus. Breathe. Achieve.</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            <label className="block text-slate-300 text-sm font-semibold mb-3 uppercase tracking-wide">
              Target Sessions
            </label>
            
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setTargetSessions(Math.max(1, targetSessions - 1))}
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors"
              >
                −
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-7xl font-black text-white tracking-tighter">
                  {targetSessions}
                </div>
                <div className="text-slate-400 text-sm mt-1">
                  {(() => {
                    // Long break occurs after sessions: 4, 8, 12, ...
                    // For estimation, count breaks after ALL sessions including the last
                    const longBreakCount = Math.floor(targetSessions / 4);
                    const shortBreakCount = targetSessions - longBreakCount;
                    const totalBreakTime = longBreakCount * LONG_BREAK + shortBreakCount * SHORT_BREAK;
                    return `${targetSessions * FOCUS_TIME}s focus + ${totalBreakTime}s breaks`;
                  })()}
                </div>
              </div>
              
              <button
                onClick={() => setTargetSessions(Math.min(12, targetSessions + 1))}
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
            
            <button
              onClick={startPomodoro}
              className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Start Pomodoro
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TIMER SCREEN
  if (phase === 'focus' || phase === 'shortBreak' || phase === 'longBreak') {
    const progress = getProgress();
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getPhaseColor()} flex flex-col items-center justify-center p-6 relative`}>
        {/* Session counter */}
        <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md rounded-full px-5 py-2">
          <span className="text-white font-bold text-sm">
            Session {completedSessions + (phase === 'focus' ? 1 : 0)} / {targetSessions}
          </span>
        </div>

        {/* Phase label */}
        <h2 className="text-white text-3xl font-black mb-8 tracking-tight">
          {getPhaseLabel()}
        </h2>

        {/* Timer circle */}
        <div className="relative w-80 h-80 mb-12">
          {/* Progress ring */}
          <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl font-black text-white tracking-tighter mb-2">
                {formatTime(timeRemaining)}
              </div>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="text-white/80 hover:text-white text-sm font-semibold uppercase tracking-wide transition-colors"
              >
                {isRunning ? '❚❚ Pause' : '▶ Play'}
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={restartSession}
            className="flex-1 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-2xl transition-all"
          >
            ↻ Restart Session
          </button>
          
          {(phase === 'shortBreak' || phase === 'longBreak') && (
            <button
              onClick={() => {
                setShowSkipConfirm(true);
                setIsRunning(false); // Pause break timer while deciding
              }}
              className="flex-1 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-2xl transition-all"
            >
              ⏭ Skip Break
            </button>
          )}
        </div>

        <button
          onClick={() => setShowStopConfirm(true)}
          className="mt-4 text-white/60 hover:text-white text-sm font-semibold transition-colors"
        >
          Stop Session
        </button>

        {/* Transition Modal */}
        {showTransitionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-6xl mb-4 text-center">
                {nextPhase === 'focus' ? '🎯' : '☕'}
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 text-center">
                {nextPhase === 'focus' ? 'Ready to Focus?' : 'Time for a Break!'}
              </h3>
              <p className="text-slate-600 text-center mb-6">
                {nextPhase === 'focus' && 'Let\'s get back to work'}
                {nextPhase === 'shortBreak' && 'Take 5 minutes to recharge'}
                {nextPhase === 'longBreak' && 'You earned a longer break - 15 minutes!'}
              </p>
              <button
                onClick={confirmTransition}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Stop Confirmation Modal */}
        {showStopConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                Stop Pomodoro Session?
              </h3>
              <p className="text-slate-600 mb-6">
                Your progress will be lost. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={stopSession}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skip Break Confirmation Modal */}
        {showSkipConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-5xl mb-3 text-center">⚠️</div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 text-center">
                Skip This Break?
              </h3>
              <p className="text-slate-600 mb-6 text-center">
                Breaks help maintain focus and prevent burnout. Taking them will improve your productivity.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSkipConfirm(false);
                    setIsRunning(true); // Resume break timer
                  }}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-colors"
                >
                  Take Break
                </button>
                <button
                  onClick={skipBreak}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                >
                  Skip Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SUMMARY SCREEN
  if (phase === 'summary') {
    const metrics = calculateMetrics();
    const distractionScore = restartCount + skipBreakCount;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-5xl font-black text-white mb-3 tracking-tight">
              Session Complete!
            </h2>
            <p className="text-slate-400 text-lg">
              Great work staying focused
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl mb-6">
            {/* Main metrics */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-700/30 rounded-2xl p-6">
                <div className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Sessions Completed
                </div>
                <div className="text-5xl font-black text-white">
                  {completedSessions}
                </div>
              </div>
              
              <div className="bg-slate-700/30 rounded-2xl p-6">
                <div className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Focus Time
                </div>
                <div className="text-5xl font-black text-white">
                  {completedSessions * FOCUS_TIME}
                  <span className="text-2xl text-slate-400 ml-1">sec</span>
                </div>
              </div>
            </div>

            {/* Time details */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-400 font-medium">Started</span>
                <span className="text-white font-bold">{metrics.startTime}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-400 font-medium">Finished</span>
                <span className="text-white font-bold">{metrics.endTime}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-400 font-medium">Actual Duration</span>
                <span className="text-white font-bold">
                  {metrics.actualMinutes > 0 && `${metrics.actualMinutes} min `}
                  {metrics.actualSeconds} sec
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-400 font-medium">Estimated Duration</span>
                <span className="text-white font-bold">{metrics.estimatedDuration} min</span>
              </div>
              
              <div className="pl-4 py-2 border-b border-slate-700/50">
                <div className="text-slate-500 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Focus sessions: {targetSessions} × {FOCUS_TIME}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breaks: {targetSessions - 1} total</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400 font-medium">Time Difference</span>
                <span className={`font-bold ${metrics.difference > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {metrics.difference > 0 ? '+' : ''}{metrics.difference} min
                </span>
              </div>
            </div>

            {/* Distraction metrics */}
            {distractionScore > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8">
                <div className="text-orange-400 text-sm font-semibold mb-3 uppercase tracking-wide">
                  Distraction Analysis
                </div>
                
                <div className="space-y-2">
                  {restartCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Sessions restarted</span>
                      <span className="text-white font-bold">{restartCount}×</span>
                    </div>
                  )}
                  
                  {skipBreakCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Breaks skipped</span>
                      <span className="text-white font-bold">{skipBreakCount}×</span>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm mt-4">
                  {distractionScore <= 2 && "Good job staying focused! 💪"}
                  {distractionScore > 2 && distractionScore <= 5 && "Try minimizing distractions next time 🎯"}
                  {distractionScore > 5 && "Consider eliminating distractions before your next session ⚡"}
                </p>
              </div>
            )}

            {/* Success message */}
            {distractionScore === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
                <div className="text-green-400 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Perfect Focus! 🎯
                </div>
                <p className="text-slate-300 text-sm">
                  You completed all sessions without interruptions. Excellent work!
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              setPhase('input');
              setTargetSessions(4);
            }}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Start New Pomodoro Session
          </button>
        </div>
      </div>
    );
  }

  return null;
}

import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface StudySession {
  id: string;
  contentId: string;
  contentType: string;
  sessionStart: string;
  sessionEnd?: string;
  durationSeconds?: number;
  completed: boolean;
}

interface UseStudySessionOptions {
  contentId: string;
  contentType: 'lesson' | 'quiz' | 'flashcards' | 'chat' | 'podcast' | 'notes' | 'tools';
  autoStart?: boolean;
}

export function useStudySession({ contentId, contentType, autoStart = true }: UseStudySessionOptions) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start a new study session
  const startSession = async () => {
    try {
      const response = await apiRequest('POST', '/api/study-sessions/start', { contentId, contentType });
      const newSession = await response.json();
      
      setSession(newSession);
      setIsActive(true);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      
      // Start the timer
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      
      return newSession;
    } catch (error) {
      console.error('Failed to start study session:', error);
      return null;
    }
  };

  // End the current study session
  const endSession = async () => {
    if (!session || !isActive) return null;

    try {
      const response = await apiRequest('POST', `/api/study-sessions/${session.id}/end`);
      const completedSession = await response.json();
      
      setIsActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setSession(completedSession);
      return completedSession;
    } catch (error) {
      console.error('Failed to end study session:', error);
      return null;
    }
  };

  // Pause the timer (without ending the session)
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  };

  // Resume the timer
  const resumeTimer = () => {
    if (!session || isActive) return;
    
    setIsActive(true);
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-start session if enabled
  useEffect(() => {
    if (autoStart && !session) {
      startSession();
    }
  }, [contentId, contentType, autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-end session when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && isActive) {
        // Use navigator.sendBeacon for reliable cleanup
        navigator.sendBeacon(`/api/study-sessions/${session.id}/end`, '{}');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isActive]);

  return {
    session,
    elapsedTime,
    isActive,
    formattedTime: formatTime(elapsedTime),
    startSession,
    endSession,
    pauseTimer,
    resumeTimer,
  };
}
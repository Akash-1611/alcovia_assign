import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Image,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';

// CONFIGURATION - Update these after deployment
const API_URL = 'https://alcovia-assign.onrender.com/api';
const SOCKET_URL = 'https://alcovia-assign.onrender.com';
const DEMO_STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';

type StudentStatus = 'on_track' | 'needs_intervention' | 'remedial_assigned';

interface StudentState {
  id: string;
  status: StudentStatus;
  name: string;
  email: string;
}

interface ActiveIntervention {
  id: string;
  remedial_task: string;
  status: string;
}

export default function App() {
  // State Management
  const [student, setStudent] = useState<StudentState | null>(null);
  const [activeIntervention, setActiveIntervention] = useState<ActiveIntervention | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Focus Timer State
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Quiz State
  const [quizScore, setQuizScore] = useState('');
  
  // Tab Detection State (Bonus #1)
  const [tabSwitches, setTabSwitches] = useState(0);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  
  // WebSocket State (Bonus #2)
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Success/Error Message State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Blinking Animation
  const blinkAnim = useRef(new Animated.Value(1)).current;
  
  // Mentor Email State (for recruiter testing)
  const [mentorEmail, setMentorEmail] = useState('');

  // Blinking Animation Effect
  useEffect(() => {
    if (isTimerRunning && connected) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [isTimerRunning, connected]);

  // Initialize WebSocket connection (Bonus #2)
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      
      // Join student-specific room
      if (student?.id) {
        socketInstance.emit('join_student_room', student.id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    // Real-time status updates
    socketInstance.on('status_update', (data: any) => {
      console.log('📡 Status update received:', data);
      if (student) {
        setStudent({ ...student, status: data.status });
      }
      Alert.alert('Status Update', data.message);
    });

    socketInstance.on('intervention_assigned', (data: any) => {
      console.log('📡 Intervention assigned:', data);
      if (student) {
        setStudent({ ...student, status: data.status });
      }
      setActiveIntervention({
        id: data.intervention_id,
        remedial_task: data.remedial_task,
        status: 'assigned'
      });
      // Clear any previous messages - intervention state takes over
      setErrorMessage(null);
      setSuccessMessage(null);
      Alert.alert('Mentor Response', data.message);
    });

    socketInstance.on('task_completed', (data: any) => {
      console.log('📡 Task completed:', data);
      if (student) {
        setStudent({ ...student, status: data.status });
      }
      setActiveIntervention(null);
      // Clear error message and show success
      setErrorMessage(null);
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      Alert.alert('Success', data.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [student?.id]);

  // Tab/Window Detection (Bonus #1) - Web only
  useEffect(() => {
    if (Platform.OS !== 'web' || !isTimerRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        // IMMEDIATELY STOP THE TIMER
        setIsTimerRunning(false);
        setTabSwitches(prev => prev + 1);
        setCheatingDetected(true);
        Alert.alert(
          '❌ Session Failed!',
          'Tab switching detected. Your focus session has been terminated and will be reported to your mentor.',
          [{ text: 'OK' }]
        );
      }
    };

    const handleBlur = () => {
      if (isTimerRunning) {
        // IMMEDIATELY STOP THE TIMER
        setIsTimerRunning(false);
        setTabSwitches(prev => prev + 1);
        setCheatingDetected(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isTimerRunning]);

  // Load student status on mount
  useEffect(() => {
    loadStudentStatus();
  }, []);

  // Focus Timer Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds(prev => {
          const newSeconds = prev + 1;
          setFocusMinutes(Math.floor(newSeconds / 60));
          return newSeconds;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTimerRunning]);

  const loadStudentStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/student/${DEMO_STUDENT_ID}/status`);
      const data = await response.json();
      
      setStudent(data.student);
      setActiveIntervention(data.active_intervention);
      
      // Join WebSocket room after loading student
      if (socket) {
        socket.emit('join_student_room', DEMO_STUDENT_ID);
      }
    } catch (error) {
      console.error('Error loading student status:', error);
      Alert.alert('Error', 'Failed to load student status. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const startFocusTimer = () => {
    setTimerSeconds(0);
    setFocusMinutes(0);
    setTabSwitches(0);
    setCheatingDetected(false);
    setIsTimerRunning(true);
    // Clear any previous messages
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const stopFocusTimer = () => {
    setIsTimerRunning(false);
  };

  const submitDailyCheckin = async () => {
    console.log('🚀 SUBMIT CLICKED!');
    console.log('Current State:', {
      quizScore,
      focusMinutes,
      timerSeconds,
      tabSwitches,
      cheatingDetected,
      isTimerRunning
    });
    
    if (!quizScore || isNaN(Number(quizScore))) {
      Alert.alert('Error', 'Please enter a valid quiz score (0-10)');
      return;
    }

    const score = Number(quizScore);
    if (score < 0 || score > 10) {
      Alert.alert('Error', 'Quiz score must be between 0 and 10');
      return;
    }

    // Allow submission if timer was started (even if < 1 minute) OR cheating detected
    // We need to log penalties even for very short sessions
    const shouldBlock = focusMinutes === 0 && timerSeconds === 0 && !cheatingDetected;
    console.log('Should block submission?', shouldBlock, {
      focusMinutes_is_0: focusMinutes === 0,
      timerSeconds_is_0: timerSeconds === 0,
      not_cheatingDetected: !cheatingDetected
    });
    
    if (shouldBlock) {
      console.log('❌ BLOCKED: Please start a focus session first');
      Alert.alert('Error', 'Please start a focus session first');
      return;
    }
    
    console.log('✅ PROCEEDING with submission...');
    setLoading(true);
    stopFocusTimer();

    try {
      // Calculate precise minutes (including fractions for short sessions)
      const preciseMinutes = timerSeconds / 60;
      
      console.log('📤 Submitting check-in:', {
        quiz_score: score,
        focus_minutes: preciseMinutes,
        timer_seconds: timerSeconds,
        tab_switches: tabSwitches,
        cheating_detected: cheatingDetected
      });
      
      const requestBody = {
        student_id: DEMO_STUDENT_ID,
        quiz_score: score,
        focus_minutes: preciseMinutes,  // Send precise value (e.g., 0.33 for 20 sec)
        tab_switches: tabSwitches,
        cheating_detected: cheatingDetected,
        mentor_email: mentorEmail || 'mentor@alcovia.com'  // For recruiter testing
      };
      
      console.log('📡 Fetching:', `${API_URL}/daily-checkin`);
      console.log('📡 Request body:', requestBody);
      
      const response = await fetch(`${API_URL}/daily-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 Response data:', JSON.stringify(data, null, 2));
      
      // DEBUG: Log the response
      console.log('📥 Check-in Response:', data);
      console.log('📥 Response Status:', data.status);
      console.log('📥 Student Status:', data.student_status);
      
      // Update local state
      setStudent(prev => prev ? { ...prev, status: data.student_status } : null);
      
      if (data.status === 'On Track') {
        console.log('✅ SUCCESS PATH - Showing success alert');
        setSuccessMessage(data.message);
        setErrorMessage(null);
        Alert.alert('Success! 🎉', data.message);
        // Reset form
        setQuizScore('');
        setFocusMinutes(0);
        setTimerSeconds(0);
        setTabSwitches(0);
        setCheatingDetected(false);
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        console.log('❌ FAILURE PATH - Showing intervention alert');
        setErrorMessage(data.message);
        setSuccessMessage(null);
        Alert.alert('Intervention Required', data.message);
      }

      await loadStudentStatus();
    } catch (error) {
      console.error('❌ ERROR submitting check-in:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to submit check-in:\n${errorMessage}\n\nPlease check:\n1. Backend is running (npm run dev)\n2. Console for details`);
      setErrorMessage(`Submission failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const completeRemedialTask = async () => {
    if (!activeIntervention) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/complete-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: DEMO_STUDENT_ID,
          intervention_id: activeIntervention.id
        })
      });

      const data = await response.json();
      
      Alert.alert('Task Completed! 🎉', data.message);
      
      // Update state
      setStudent(prev => prev ? { ...prev, status: 'on_track' } : null);
      setActiveIntervention(null);
      
      // Clear error message and show success
      setErrorMessage(null);
      setSuccessMessage('Great! You have completed your remedial task. You are back on track.');
      
      // Reset everything
      setQuizScore('');
      setFocusMinutes(0);
      setTimerSeconds(0);
      setTabSwitches(0);
      setCheatingDetected(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // RENDER: Loading State
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // RENDER: Locked State (needs_intervention)
  if (student?.status === 'needs_intervention') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Account Locked</Text>
          <Text style={styles.lockedMessage}>
            Analysis in progress. Waiting for Mentor...
          </Text>
          <Text style={styles.lockedSubtext}>
            Your recent performance needs attention. A mentor is reviewing your progress and will assign a remedial task shortly.
          </Text>
          {connected && (
            <View style={styles.websocketBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.websocketText}>Live Connection Active</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadStudentStatus}
          >
            <Text style={styles.refreshButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // RENDER: Remedial State (remedial_assigned)
  if (student?.status === 'remedial_assigned' && activeIntervention) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.remedialContainer}>
          <Text style={styles.remedialIcon}>📚</Text>
          <Text style={styles.remedialTitle}>Remedial Task Assigned</Text>
          <Text style={styles.remedialMessage}>
            Complete this task to unlock full access:
          </Text>
          <View style={styles.taskCard}>
            <Text style={styles.taskText}>{activeIntervention.remedial_task}</Text>
          </View>
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={completeRemedialTask}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // RENDER: Normal State (on_track)
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.headerContent}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircles}>
              {/* Top Left - Pink */}
              <View style={[styles.logoCircle, { 
                backgroundColor: '#e11d48', 
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 4
              }]} />
              {/* Top Right - Purple */}
              <View style={[styles.logoCircle, { 
                backgroundColor: '#7c3aed',
                position: 'absolute',
                top: 0,
                left: 12,
                zIndex: 3
              }]} />
              {/* Bottom Right - Yellow */}
              <View style={[styles.logoCircle, { 
                backgroundColor: '#f59e0b',
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 2
              }]} />
              {/* Bottom Left - Purple (darker) */}
              <View style={[styles.logoCircle, { 
                backgroundColor: '#6b21a8',
                position: 'absolute',
                top: 12,
                left: 0,
                zIndex: 1
              }]} />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTitle, isDarkMode && { color: '#ffffff' }]}>alcovia</Text>
              <Text style={[styles.logoSubtitle, isDarkMode && { color: '#cbd5e1' }]}>ahead of the curve</Text>
            </View>
          </View>
          
          {/* Right Section */}
          <View style={styles.headerRight}>
            {/* Student Info Card */}
            <View style={styles.studentInfoCard}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>
                  {(student?.name || 'Demo Student').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={[styles.studentNameText, isDarkMode && { color: '#1e293b' }]}>
                  {student?.name || 'Demo Student'}
                </Text>
                <View style={styles.studentStatusRow}>
                  <View style={[
                    styles.statusIndicator, 
                    student?.status === 'on_track' && styles.statusOnTrack,
                    student?.status === 'needs_intervention' && styles.statusIntervention,
                    student?.status === 'remedial_assigned' && styles.statusRemedial
                  ]} />
                  <Text style={[styles.statusLabel, isDarkMode && { color: '#64748b' }]}>
                    {student?.status === 'on_track' && 'On Track'}
                    {student?.status === 'needs_intervention' && 'Intervention'}
                    {student?.status === 'remedial_assigned' && 'Remedial Task'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Dark Mode Toggle */}
            <TouchableOpacity 
              style={styles.darkModeToggle}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Text style={styles.darkModeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            
            {connected && (
              <View style={styles.statusBadge}>
                <Animated.View style={[
                  styles.statusDot,
                  isTimerRunning && { opacity: blinkAnim }
                ]} />
                <Text style={styles.statusText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Centered Dashboard Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.dashboardTitle, isDarkMode && { color: '#fbbf24' }]}>
            Student Focus Dashboard
          </Text>
          <View style={styles.titleUnderline} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {/* Success Message Banner */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerTitle}>✅ Success!</Text>
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        )}
        
        {/* Error Message Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>⚠️ Intervention Required</Text>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}
        
        {/* Focus Timer Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Focus Timer ⏱️</Text>
          <Text style={styles.timerDisplay}>
            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
            {(timerSeconds % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={styles.timerSubtext}>
            {focusMinutes} minutes logged
          </Text>
          {cheatingDetected && (
            <View style={styles.cheatingAlert}>
              <Text style={styles.cheatingAlertText}>
                ❌ SESSION FAILED - Tab switching detected: {tabSwitches} times
              </Text>
              <Text style={styles.cheatingSubtext}>
                This will result in intervention when you submit.
              </Text>
            </View>
          )}
          {!isTimerRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={startFocusTimer}>
              <Text style={styles.startButtonText}>Start Focus Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopFocusTimer}>
              <Text style={styles.stopButtonText}>Stop Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily Quiz Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Quiz 📝</Text>
          <Text style={styles.label}>Enter your quiz score (0-10):</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 8, 9, or 10"
            placeholderTextColor="#a78bfa"
            keyboardType="numeric"
            value={quizScore}
            onChangeText={setQuizScore}
            maxLength={2}
          />
        </View>

        {/* Mentor Email Section (For Recruiter Testing) */}
        <View style={[styles.card, styles.recruiterCard]}>
          <Text style={styles.cardTitle}>📧 Mentor Email (For Testing)</Text>
          <Text style={styles.recruiterLabel}>
            Enter your email to receive intervention notifications:
          </Text>
          <TextInput
            style={styles.input}
            placeholder="your-email@example.com"
            placeholderTextColor="#a78bfa"
            keyboardType="email-address"
            value={mentorEmail}
            onChangeText={setMentorEmail}
            autoCapitalize="none"
          />
          <Text style={styles.recruiterHint}>
            💡 This lets you (the recruiter) test the full intervention flow by receiving the mentor email yourself!
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={submitDailyCheckin}
          disabled={loading || isTimerRunning}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isTimerRunning ? 'Stop timer first' : 'Submit Daily Check-in'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          ℹ️ Requirements: Quiz score must be 8, 9, or 10 (not 7!) AND Focus time &gt; 1 minute (TESTING MODE)
        </Text>
        <Text style={styles.infoText}>
          ⚠️ Tab switching will automatically FAIL your session!
        </Text>
        <Text style={[styles.infoText, { color: '#f59e0b', fontWeight: '800' }]}>
          ⚠️ TESTING MODE: Threshold lowered to 1 minute (Production: 60 minutes)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    position: 'relative',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    shadowColor: '#000',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircles: {
    position: 'relative',
    width: 30,
    height: 30,
    marginRight: 14,
  },
  logoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  logoSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'lowercase',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  darkModeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkModeIcon: {
    fontSize: 18,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e7ff',
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#7c3aed',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleUnderline: {
    height: 3,
    width: 80,
    backgroundColor: '#f59e0b',
    borderRadius: 2,
    marginTop: 8,
  },
  studentInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 14,
    paddingLeft: 6,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#c4b5fd',
    marginRight: 12,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  studentDetails: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 3,
  },
  studentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusOnTrack: {
    backgroundColor: '#10b981',
  },
  statusIntervention: {
    backgroundColor: '#f59e0b',
  },
  statusRemedial: {
    backgroundColor: '#3b82f6',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fecaca',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  content: {
    padding: 24,
    paddingBottom: 80,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#c4b5fd',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6b21a8',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  recruiterCard: {
    borderColor: '#14b8a6',
    borderWidth: 3,
    backgroundColor: '#f0fdfa',
  },
  recruiterLabel: {
    fontSize: 15,
    color: '#0f766e',
    marginBottom: 12,
    fontWeight: '600',
  },
  recruiterHint: {
    fontSize: 13,
    color: '#0d9488',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '900',
    color: '#f97316',
    textAlign: 'center',
    marginVertical: 20,
    letterSpacing: 4,
    textShadowColor: 'rgba(249, 115, 22, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  timerSubtext: {
    fontSize: 18,
    color: '#7c3aed',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  cheatingAlert: {
    backgroundColor: '#fecaca',
    borderWidth: 4,
    borderColor: '#f43f5e',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  cheatingAlertText: {
    fontSize: 18,
    color: '#be123c',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cheatingSubtext: {
    fontSize: 15,
    color: '#e11d48',
    textAlign: 'center',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#5eead4',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stopButton: {
    backgroundColor: '#f43f5e',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fda4af',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 17,
    color: '#6b21a8',
    marginBottom: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#faf5ff',
    color: '#581c87',
    padding: 20,
    borderRadius: 16,
    fontSize: 22,
    borderWidth: 3,
    borderColor: '#c4b5fd',
    fontWeight: '700',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 22,
    paddingHorizontal: 50,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fde68a',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderColor: '#d1d5db',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 14,
    color: '#7c3aed',
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 6,
    fontWeight: '600',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fef3c7',
  },
  lockedIcon: {
    fontSize: 120,
    marginBottom: 28,
  },
  lockedTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#92400e',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  lockedMessage: {
    fontSize: 24,
    color: '#f59e0b',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '800',
  },
  lockedSubtext: {
    fontSize: 18,
    color: '#b45309',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    maxWidth: 600,
    fontWeight: '600',
  },
  websocketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#c4b5fd',
  },
  pulsingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fde68a',
    marginRight: 12,
  },
  websocketText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#f59e0b',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  remedialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#e0e7ff',
  },
  remedialIcon: {
    fontSize: 120,
    marginBottom: 28,
  },
  remedialTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4c1d95',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  remedialMessage: {
    fontSize: 20,
    color: '#6b21a8',
    marginBottom: 36,
    textAlign: 'center',
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 24,
    marginBottom: 44,
    borderLeftWidth: 8,
    borderLeftColor: '#7c3aed',
    width: '100%',
    maxWidth: 700,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#c4b5fd',
  },
  taskText: {
    fontSize: 20,
    color: '#3b0764',
    lineHeight: 32,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 22,
    paddingHorizontal: 56,
    borderRadius: 50,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#5eead4',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  loadingText: {
    color: '#7c3aed',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: '#ccfbf1',
    borderWidth: 4,
    borderColor: '#14b8a6',
    padding: 28,
    borderRadius: 24,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  successBannerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f766e',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  successBannerText: {
    fontSize: 19,
    color: '#0d9488',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#fed7aa',
    borderWidth: 4,
    borderColor: '#f97316',
    padding: 28,
    borderRadius: 24,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  errorBannerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#c2410c',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  errorBannerText: {
    fontSize: 19,
    color: '#ea580c',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
  },
});


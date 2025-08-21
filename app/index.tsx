import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, TrendingUp, Users, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/auth-context';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      // Redirect based on account type
      if (user.accountType === 'admin') {
        router.replace('/(admin)/dashboard' as any);
      } else {
        router.replace('/(tabs)/home' as any);
      }
    }
  }, [user, isLoading, router]);

  // Show loading or landing page
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.backgroundGradient}
        />
        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Phone Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneScreen}>
                <View style={styles.mathIllustration}>
                  <Calculator size={50} color="#10B981" />
                  <View style={styles.mathElements}>
                    <Text style={styles.mathSymbol}>π</Text>
                    <Text style={styles.mathSymbol}>∑</Text>
                    <Text style={styles.mathSymbol}>∫</Text>
                  </View>
                </View>
                <View style={styles.studentsIllustration}>
                  <View style={styles.studentAvatar}>
                    <Users size={18} color="#FFFFFF" />
                  </View>
                  <View style={[styles.studentAvatar, styles.studentAvatar2]}>
                    <BookOpen size={18} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </View>
            
            {/* Floating Elements */}
            <View style={styles.floatingElement}>
              <TrendingUp size={20} color="#F59E0B" />
            </View>
            <View style={styles.floatingElement2}>
              <Text style={styles.floatingText}>95%</Text>
            </View>
          </View>
          
          {/* Text Content */}
          <View style={styles.textSection}>
            <Text style={styles.mainTitle}>The only math app{"\n"}you&apos;ll ever need</Text>
            <Text style={styles.subtitle}>
              Track your progress, manage scores,{"\n"}and connect with teachers in one app.
            </Text>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.primaryButtonText}>Let&apos;s start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationContainer: {
    position: 'relative',
    marginTop: height * 0.08,
    marginBottom: height * 0.06,
  },
  phoneFrame: {
    width: width * 0.65,
    height: width * 0.8,
    backgroundColor: '#1F2937',
    borderRadius: 28,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mathIllustration: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mathElements: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  mathSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  studentsIllustration: {
    flexDirection: 'row',
    gap: 10,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatar2: {
    backgroundColor: '#8B5CF6',
  },
  floatingElement: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    top: -15,
    right: -15,
  },
  floatingElement2: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    bottom: 30,
    left: -20,
  },
  floatingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: height * 0.04,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },

  buttonContainer: {
    width: '100%',
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
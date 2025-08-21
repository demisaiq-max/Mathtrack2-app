import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, TrendingUp, Users, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/auth-context';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

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
      
      <SafeAreaView style={styles.safeArea} edges={isWeb ? [] : ['top', 'bottom']}>
        <View style={[styles.content, isWeb && !isMobile && styles.webContent]}>
          {/* Phone Illustration */}
          <View style={[styles.illustrationContainer, isWeb && !isMobile && styles.webIllustrationContainer]}>
            <View style={[styles.phoneFrame, isWeb && !isMobile && styles.webPhoneFrame]}>
              <View style={styles.phoneScreen}>
                <View style={styles.mathIllustration}>
                  <Calculator size={isWeb && !isMobile ? 60 : 50} color="#10B981" />
                  <View style={styles.mathElements}>
                    <Text style={[styles.mathSymbol, isWeb && !isMobile && styles.webMathSymbol]}>π</Text>
                    <Text style={[styles.mathSymbol, isWeb && !isMobile && styles.webMathSymbol]}>∑</Text>
                    <Text style={[styles.mathSymbol, isWeb && !isMobile && styles.webMathSymbol]}>∫</Text>
                  </View>
                </View>
                <View style={styles.studentsIllustration}>
                  <View style={[styles.studentAvatar, isWeb && !isMobile && styles.webStudentAvatar]}>
                    <Users size={isWeb && !isMobile ? 24 : 18} color="#FFFFFF" />
                  </View>
                  <View style={[styles.studentAvatar, styles.studentAvatar2, isWeb && !isMobile && styles.webStudentAvatar]}>
                    <BookOpen size={isWeb && !isMobile ? 24 : 18} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </View>
            
            {/* Floating Elements */}
            <View style={[styles.floatingElement, isWeb && !isMobile && styles.webFloatingElement]}>
              <TrendingUp size={isWeb && !isMobile ? 28 : 20} color="#F59E0B" />
            </View>
            <View style={[styles.floatingElement2, isWeb && !isMobile && styles.webFloatingElement2]}>
              <Text style={[styles.floatingText, isWeb && !isMobile && styles.webFloatingText]}>95%</Text>
            </View>
          </View>
          
          {/* Text Content */}
          <View style={[styles.textSection, isWeb && !isMobile && styles.webTextSection]}>
            <Text style={[styles.mainTitle, isWeb && !isMobile && styles.webMainTitle]}>The only math app{"\n"}you&apos;ll ever need</Text>
            <Text style={[styles.subtitle, isWeb && !isMobile && styles.webSubtitle]}>
              Track your progress, manage scores,{"\n"}and connect with teachers in one app.
            </Text>
          </View>
          
          {/* Buttons */}
          <View style={[styles.buttonContainer, isWeb && !isMobile && styles.webButtonContainer]}>
            <TouchableOpacity 
              style={[styles.primaryButton, isWeb && !isMobile && styles.webPrimaryButton]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.primaryButtonText, isWeb && !isMobile && styles.webButtonText]}>Let&apos;s start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, isWeb && !isMobile && styles.webSecondaryButton]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.secondaryButtonText, isWeb && !isMobile && styles.webButtonText]}>Create Account</Text>
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
  webContent: {
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  illustrationContainer: {
    position: 'relative',
    marginTop: height * 0.08,
    marginBottom: height * 0.06,
  },
  webIllustrationContainer: {
    marginTop: 40,
    marginBottom: 40,
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
  webPhoneFrame: {
    width: 280,
    height: 350,
    borderRadius: 32,
    padding: 8,
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
  webMathSymbol: {
    fontSize: 24,
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
  webStudentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  webFloatingElement: {
    width: 68,
    height: 68,
    borderRadius: 34,
    top: -20,
    right: -20,
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
  webFloatingElement2: {
    width: 58,
    height: 58,
    borderRadius: 29,
    bottom: 40,
    left: -25,
  },
  floatingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  webFloatingText: {
    fontSize: 16,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: height * 0.04,
  },
  webTextSection: {
    paddingHorizontal: 0,
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  webMainTitle: {
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  webSubtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 16,
    gap: 12,
  },
  webButtonContainer: {
    paddingBottom: 0,
    gap: 16,
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
  webPrimaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
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
  webSecondaryButton: {
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 40,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  webButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
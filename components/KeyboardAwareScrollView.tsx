import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  keyboardOpeningTime?: number;
  resetScrollToCoords?: { x: number; y: number };
  viewIsInsideTabBar?: boolean;
  innerRef?: React.RefObject<ScrollView>;
}

export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  extraScrollHeight = 75,
  enableOnAndroid = true,
  enableAutomaticScroll = true,
  keyboardOpeningTime = 250,
  resetScrollToCoords = { x: 0, y: 0 },
  viewIsInsideTabBar = false,
  innerRef,
  contentContainerStyle,
  style,
  ...props
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const defaultScrollViewRef = useRef<ScrollView>(null);
  const scrollViewRef = innerRef || defaultScrollViewRef;

  useEffect(() => {

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        if (!enableAutomaticScroll) return;
        
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        
        // Auto-scroll to focused input after keyboard animation
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, keyboardOpeningTime);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        
        // Reset scroll position when keyboard hides
        if (resetScrollToCoords && scrollViewRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              ...resetScrollToCoords,
              animated: true,
            });
          }, keyboardOpeningTime);
        }
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [enableAutomaticScroll, keyboardOpeningTime, resetScrollToCoords, scrollViewRef]);

  const keyboardAvoidingViewBehavior = Platform.select({
    ios: 'padding' as const,
    android: enableOnAndroid ? 'height' as const : undefined,
  });

  const keyboardVerticalOffset = Platform.select({
    ios: viewIsInsideTabBar ? insets.bottom + 49 : insets.top, // 49 is typical tab bar height
    android: 0,
  });

  // Calculate content container padding bottom to ensure content is not hidden behind keyboard
  const contentPaddingBottom = Platform.select({
    ios: Math.max(keyboardHeight > 0 ? extraScrollHeight : 20, insets.bottom),
    android: keyboardHeight > 0 ? keyboardHeight + extraScrollHeight : 20,
  });

  const containerStyle = [
    styles.container,
    style,
  ];

  const scrollContentStyle = [
    {
      paddingBottom: contentPaddingBottom,
      flexGrow: 1,
    },
    contentContainerStyle,
  ];

  if (Platform.OS === 'ios' || enableOnAndroid) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={keyboardAvoidingViewBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.scrollView, style]}
      contentContainerStyle={scrollContentStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default KeyboardAwareScrollView;
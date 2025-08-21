import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = () => {
    if (!password) return { text: 'Enter password', color: '#9CA3AF', width: 0 };
    if (password.length < 6) return { text: 'Weak', color: '#EF4444', width: 33 };
    if (password.length < 10) return { text: 'Medium', color: '#F59E0B', width: 66 };
    return { text: 'Strong', color: '#10B981', width: 100 };
  };

  const strength = getStrength();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Password strength: {strength.text}</Text>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${strength.width}%`, backgroundColor: strength.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  barContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
});
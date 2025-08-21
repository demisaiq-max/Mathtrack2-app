import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  GraduationCap,
  Save,
  ArrowLeft,
  Camera,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-context';
import { useTheme } from '@/hooks/theme-context';
import { useRouter, Stack } from 'expo-router';

export default function EditProfileScreen() {
  const { user, updateUser, refreshUser } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        const asset = result.assets[0];
        
        // For now, we'll store the base64 data URL
        // In a production app, you'd upload to a storage service
        const imageUri = `data:image/jpeg;base64,${asset.base64}`;
        setProfileImage(imageUri);
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EditProfile] Updating user with:', {
        fullName: fullName.trim(),
        profileImage: profileImage,
      });
      
      await updateUser({
        ...user!,
        fullName: fullName.trim(),
        profileImage: profileImage,
      });
      
      console.log('[EditProfile] Profile updated successfully, refreshing data');
      
      // Refresh user data to ensure it's up to date
      if (refreshUser) {
        await refreshUser();
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Edit Profile',
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              <Save color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImagePhoto}
                    contentFit="cover"
                  />
                ) : (
                  <User color={colors.primaryText} size={40} />
                )}
              </View>
              <TouchableOpacity 
                style={[styles.changePhotoButton, { backgroundColor: isDark ? colors.card : '#F3F4F6' }, isUploadingImage && styles.disabledButton]}
                onPress={pickImage}
                disabled={isUploadingImage}
              >
                <Camera color={colors.primary} size={16} style={{ marginRight: 6 }} />
                <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                  {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <User color={colors.textSecondary} size={20} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <View style={[styles.inputContainer, styles.disabledInputContainer, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                <Mail color={colors.textSecondary} size={20} />
                <Text style={[styles.disabledInput, { color: colors.textSecondary }]}>{user?.email}</Text>
              </View>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Email cannot be changed</Text>
            </View>

            {user?.accountType === 'student' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Grade Level</Text>
                <View style={[styles.inputContainer, styles.disabledInputContainer, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                  <GraduationCap color={colors.textSecondary} size={20} />
                  <Text style={[styles.disabledInput, { color: colors.textSecondary }]}>{user?.gradeLevel || 'Not specified'}</Text>
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>Grade level cannot be changed</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your profile information helps teachers and administrators provide better support.
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Only your full name and profile photo can be updated. Contact an administrator to change your email or grade level.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileImagePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  disabledInputContainer: {
    opacity: 0.7,
  },
  disabledInput: {
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
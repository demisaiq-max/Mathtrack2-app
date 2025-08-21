import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function AnswerSheetUploadScreen() {
  const params = useLocalSearchParams();
  const submissionId = params.submissionId as string;
  const examTitle = params.examTitle as string;
  const { user } = useAuth();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AnswerSheetUpload] Screen loaded with params:', {
      submissionId,
      examTitle,
      userId: user?.id
    });
  }, [submissionId, examTitle, user?.id]);

  const pickDocument = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('[AnswerSheetUpload] Document picked:', file);
        
        const uploadedFile: UploadedFile = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size || 0,
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
    } catch (err) {
      console.error('[AnswerSheetUpload] Error picking document:', err);
      setError('Failed to pick document. Please try again.');
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      setError(null);
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        console.log('[AnswerSheetUpload] Image picked:', image);
        
        const uploadedFile: UploadedFile = {
          uri: image.uri,
          name: `answer_sheet_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: image.fileSize || 0,
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
    } catch (err) {
      console.error('[AnswerSheetUpload] Error picking image:', err);
      setError('Failed to pick image. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!submissionId || !user?.id) {
      Alert.alert('Error', 'Missing submission information. Please try again.');
      return;
    }

    if (uploadedFiles.length === 0) {
      Alert.alert(
        'No Files Selected',
        'You can skip this step if you don&apos;t have answer sheets to upload, or select files to upload.',
        [
          { text: 'Skip', onPress: () => handleSkipUpload() },
          { text: 'Select Files', style: 'cancel' }
        ]
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('[AnswerSheetUpload] Starting file upload for submission:', submissionId);
      
      // For now, we'll just update the submission with file info
      // In a real app, you'd upload to storage (like Supabase Storage)
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
      
      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
          file_name: fileNames,
          file_size_bytes: totalSize,
          storage_path: `submissions/${submissionId}/`, // Placeholder path
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('[AnswerSheetUpload] Error updating submission:', updateError);
        throw updateError;
      }

      console.log('[AnswerSheetUpload] Files uploaded successfully');
      
      // Navigate to results
      await navigateToResults();
      
    } catch (err) {
      console.error('[AnswerSheetUpload] Error uploading files:', err);
      setError(`Failed to upload files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipUpload = async () => {
    console.log('[AnswerSheetUpload] Skipping file upload');
    await navigateToResults();
  };

  const navigateToResults = async () => {
    if (!submissionId) {
      Alert.alert('Error', 'Missing submission information.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Fetch final results
      const { data: finalSubmission, error: fetchError } = await supabase
        .from('exam_submissions')
        .select('score_percent, earned_points, total_points')
        .eq('id', submissionId)
        .single();

      if (fetchError) {
        console.error('[AnswerSheetUpload] Error fetching results:', fetchError);
        throw fetchError;
      }

      console.log('[AnswerSheetUpload] Final submission data:', finalSubmission);

      // Navigate to results
      const score = finalSubmission.earned_points || 0;
      const maxScore = finalSubmission.total_points || 0;
      const percentage = finalSubmission.score_percent || 0;

      router.replace(`/exam-results?score=${score}&maxScore=${maxScore}&percentage=${percentage}&examTitle=${encodeURIComponent(examTitle || 'Exam')}`);
      
    } catch (err) {
      console.error('[AnswerSheetUpload] Error navigating to results:', err);
      Alert.alert('Error', `Failed to load results: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Upload Answer Sheet',
          headerLeft: () => null,
          gestureEnabled: false,
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Upload size={32} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Upload Answer Sheet</Text>
          <Text style={styles.subtitle}>
            {examTitle ? `For: ${examTitle}` : 'Upload your written answer sheets (optional)'}
          </Text>
          <Text style={styles.description}>
            If you have written answer sheets or additional work to submit, you can upload them here. 
            This step is optional - you can skip if you don&apos;t have any files to upload.
          </Text>
        </View>

        {/* Upload Options */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Options</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickDocument}
              disabled={isUploading}
            >
              <FileText size={24} color="#4F46E5" />
              <Text style={styles.uploadButtonText}>Choose Document</Text>
              <Text style={styles.uploadButtonSubtext}>PDF, Images</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(true)}
              disabled={isUploading}
            >
              <Camera size={24} color="#4F46E5" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
              <Text style={styles.uploadButtonSubtext}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(false)}
              disabled={isUploading}
            >
              <ImageIcon size={24} color="#4F46E5" />
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
              <Text style={styles.uploadButtonSubtext}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.sectionTitle}>Selected Files ({uploadedFiles.length})</Text>
            
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <FileText size={20} color="#6B7280" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFile(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipUpload}
          disabled={isUploading || isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            uploadedFiles.length === 0 && styles.submitButtonDisabled
          ]}
          onPress={uploadFiles}
          disabled={isUploading || isSubmitting || uploadedFiles.length === 0}
        >
          {isUploading || isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <CheckCircle size={16} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            {isUploading ? 'Uploading...' : isSubmitting ? 'Processing...' : 'Upload & Continue'}
          </Text>
          {!isUploading && !isSubmitting && (
            <ArrowRight size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  uploadButtons: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  filesSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
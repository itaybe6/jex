import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Camera, X } from 'lucide-react-native';

interface PreviewImageUploaderProps {
  imageUri: string;
  onImageChange: () => void;
}

const PreviewImageUploader: React.FC<PreviewImageUploaderProps> = ({ imageUri, onImageChange }) => {
  return (
    <View style={styles.imageSection}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={onImageChange}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onImageChange}
        >
          <Camera size={32} color="#007AFF" />
          <Text style={styles.uploadText}>Upload Image</Text>
          <Text style={styles.uploadSubtext}>Tap here to select an image from gallery</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Heebo-Medium',
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
});

export default PreviewImageUploader; 
import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImagePreviewProps {
  images: Array<{ uri: string }>;
  onRemove: (index: number) => void;
}

export default function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
    Alert.alert(
      'שגיאת תמונה',
      'לא הצלחנו לטעון את התמונה. אנא הסר אותה ונסה להעלות תמונה אחרת.',
      [
        { text: 'הסר תמונה', onPress: () => onRemove(index) },
        { text: 'ביטול', style: 'cancel' }
      ]
    );
  };

  const handleRemove = (index: number) => {
    Alert.alert(
      'הסרת תמונה',
      'האם אתה בטוח שברצונך להסיר תמונה זו?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'הסר', style: 'destructive', onPress: () => onRemove(index) }
      ]
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {images.map((image, index) => (
        <View key={`${image.uri}-${index}`} style={styles.imageContainer}>
          {imageErrors.has(index) ? (
            <View style={[styles.image, styles.errorImage]}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
              <Text style={styles.errorText}>שגיאה</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: image.uri }} 
              style={styles.image}
              onError={() => handleImageError(index)}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(index)}
          >
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  errorImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
}); 
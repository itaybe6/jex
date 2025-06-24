import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

// Ring size conversion data (US sizes)
const RING_SIZES = [
  { size: 3, diameter: 14.1, circumference: 44.2 },
  { size: 3.5, diameter: 14.5, circumference: 45.5 },
  { size: 4, diameter: 14.9, circumference: 46.8 },
  { size: 4.5, diameter: 15.3, circumference: 48.0 },
  { size: 5, diameter: 15.7, circumference: 49.3 },
  { size: 5.5, diameter: 16.1, circumference: 50.6 },
  { size: 6, diameter: 16.5, circumference: 51.9 },
  { size: 6.5, diameter: 16.9, circumference: 53.1 },
  { size: 7, diameter: 17.3, circumference: 54.4 },
  { size: 7.5, diameter: 17.7, circumference: 55.7 },
  { size: 8, diameter: 18.1, circumference: 56.9 },
  { size: 8.5, diameter: 18.5, circumference: 58.2 },
  { size: 9, diameter: 18.9, circumference: 59.5 },
  { size: 9.5, diameter: 19.3, circumference: 60.7 },
  { size: 10, diameter: 19.7, circumference: 62.0 },
];

interface RingSizerProps {
  onSizeChange?: (size: number) => void;
  initialDiameter?: number | null;
  pixelsPerMM?: number | null;
}

export const RingSizer: React.FC<RingSizerProps> = ({ 
  onSizeChange, 
  initialDiameter = null,
  pixelsPerMM = null
}) => {
  const [currentSize, setCurrentSize] = useState(7); // Default to size 7
  const [currentIndex, setCurrentIndex] = useState(7); // Default to index 7 (size 7)

  useEffect(() => {
    if (initialDiameter !== null) {
      // Find the closest ring size to the initial diameter
      const closestSize = RING_SIZES.reduce((prev, curr) => {
        return Math.abs(curr.diameter - initialDiameter) < Math.abs(prev.diameter - initialDiameter) ? curr : prev;
      });
      const newIndex = RING_SIZES.findIndex(size => size.size === closestSize.size);
      setCurrentIndex(newIndex);
      setCurrentSize(closestSize.size);
    }
  }, [initialDiameter]);

  const handleSizeChange = (value: number) => {
    const newIndex = Math.round(value);
    setCurrentIndex(newIndex);
    setCurrentSize(RING_SIZES[newIndex].size);
    onSizeChange?.(RING_SIZES[newIndex].diameter);
  };

  const increaseSize = () => {
    if (currentIndex < RING_SIZES.length - 1) {
      handleSizeChange(currentIndex + 1);
    }
  };

  const decreaseSize = () => {
    if (currentIndex > 0) {
      handleSizeChange(currentIndex - 1);
    }
  };

  const currentRing = RING_SIZES[currentIndex];
  // חישוב קוטר פיקסלים אמיתי לפי הכיול
  let ringDiameter = 100;
  if (pixelsPerMM) {
    ringDiameter = currentRing.diameter * pixelsPerMM;
  } else {
    // fallback: יחס מסך
    const screenWidth = Dimensions.get('window').width;
    ringDiameter = (currentRing.diameter * screenWidth) / 20;
  }

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <View
          style={[
            styles.ring,
            {
              width: ringDiameter,
              height: ringDiameter,
              borderRadius: ringDiameter / 2,
            },
          ]}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={decreaseSize} style={styles.button}>
          <Ionicons name="remove-circle" size={32} color="#007AFF" />
        </TouchableOpacity>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={RING_SIZES.length - 1}
          value={currentIndex}
          onValueChange={handleSizeChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#D3D3D3"
        />

        <TouchableOpacity onPress={increaseSize} style={styles.button}>
          <Ionicons name="add-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.sizeInfo}>
        <Text style={styles.sizeText}>US Size: {currentRing.size}</Text>
        <Text style={styles.dimensionsText}>
          Diameter: {currentRing.diameter}mm | Circumference: {currentRing.circumference}mm
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  ringContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ring: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  button: {
    padding: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sizeInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  sizeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dimensionsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
}); 
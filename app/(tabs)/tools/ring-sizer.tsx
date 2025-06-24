import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { RingSizer } from '../../../components/RingSizer';
import { Ionicons } from '@expo/vector-icons';
console.log('RingSizer:', RingSizer);

type CoinType = {
  diameter: number;
};

type CoinsType = {
  [key: string]: CoinType;
};

// Coin dimensions in mm
const COINS: CoinsType = {
  '1 Shekel': { diameter: 18 },
  '2 Shekel': { diameter: 21.6 },
  '5 Shekel': { diameter: 24 },
  '10 Shekel': { diameter: 23 },
  'Quarter Dollar': { diameter: 24.26 },
  'Dime': { diameter: 17.91 },
  'Penny': { diameter: 19.05 },
  'Nickel': { diameter: 21.21 },
};

const STORAGE_KEYS = {
  IS_CALIBRATED: 'ring_sizer_is_calibrated',
  LAST_DIAMETER: 'ring_sizer_last_diameter',
  PIXELS_PER_MM: 'ring_sizer_pixels_per_mm',
  COIN: 'ring_sizer_coin',
};

export default function RingSizerScreen() {
  const [showCalibration, setShowCalibration] = useState(true);
  const [calibrationStep, setCalibrationStep] = useState<'select' | 'adjust'>('select');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [pixelsPerMM, setPixelsPerMM] = useState<number | null>(null);
  const [calibrationCirclePx, setCalibrationCirclePx] = useState(100);
  const [lastDiameter, setLastDiameter] = useState<number | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const maxCirclePx = screenWidth * 0.8;
  const minCirclePx = 30;

  // Always require calibration on entry
  useEffect(() => {
    setShowCalibration(true);
    setCalibrationStep('select');
    setSelectedCoin(null);
    setPixelsPerMM(null);
    setCalibrationCirclePx(100);
  }, []);

  // שלב 1: בחירת מטבע
  const handleCoinSelect = (coin: string) => {
    setSelectedCoin(coin);
    setCalibrationStep('adjust');
    setCalibrationCirclePx(100); // reset
  };

  // שלב 2: התאמת עיגול למטבע
  const handleCalibrationConfirm = () => {
    if (!selectedCoin) return;
    const coinDiameterMM = COINS[selectedCoin].diameter;
    const ratio = calibrationCirclePx / coinDiameterMM;
    setPixelsPerMM(ratio);
    setShowCalibration(false);
    setCalibrationStep('select');
  };

  // שמירה של הקוטר האחרון (לא חובה, רק אם רוצים UX נוח)
  const handleDiameterChange = async (diameter: number) => {
    setLastDiameter(diameter);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F5F8FC' }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.fixedBackButton}>
        <Ionicons name="chevron-back" size={28} color="#007AFF" />
        <Text style={{ color: '#007AFF', fontSize: 18, marginLeft: 4 }}>Back</Text>
      </TouchableOpacity>
      <Stack.Screen
        options={{
          title: 'Ring Sizer',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => { setShowCalibration(true); setCalibrationStep('select'); }}
              style={styles.calibrateButton}
            >
              <Text style={styles.calibrateButtonText}>Calibrate</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Modal
        visible={showCalibration}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalibration(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {calibrationStep === 'select' && (
              <>
                <Text style={styles.modalTitle}>Screen Calibration</Text>
                <Text style={styles.modalSubtitle}>
                  Select a coin you have, and place it on the screen. Adjust the circle to match the coin – this helps us display ring sizes with real-world accuracy.
                </Text>
                <Text style={[styles.modalSubtitle, { color: '#007AFF', fontWeight: 'bold', marginBottom: 10 }]}>Select a coin for calibration:</Text>
                <ScrollView style={styles.coinList}>
                  {Object.keys(COINS).map((coin) => (
                    <TouchableOpacity
                      key={coin}
                      style={styles.coinButton}
                      onPress={() => handleCoinSelect(coin)}
                    >
                      <Text style={styles.coinButtonText}>{coin}</Text>
                      <Text style={styles.coinDiameter}>
                        {COINS[coin].diameter}mm
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            {calibrationStep === 'adjust' && selectedCoin && (
              <>
                <Text style={styles.modalTitle}>Adjust Circle</Text>
                <Text style={styles.modalSubtitle}>
                  Use the slider to match the circle to your {selectedCoin} coin.
                </Text>
                <View style={{ alignItems: 'center', marginVertical: 24 }}>
                  <View style={{
                    width: calibrationCirclePx,
                    height: calibrationCirclePx,
                    borderRadius: calibrationCirclePx / 2,
                    borderWidth: 2,
                    borderColor: '#007AFF',
                  }} />
                </View>
                <Slider
                  style={{ width: '100%' }}
                  minimumValue={minCirclePx}
                  maximumValue={maxCirclePx}
                  value={calibrationCirclePx}
                  onValueChange={setCalibrationCirclePx}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#D3D3D3"
                />
                <Text style={{ textAlign: 'center', marginTop: 8 }}>
                  Diameter: {Math.round(calibrationCirclePx)} px
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCalibrationConfirm}
                >
                  <Text style={styles.closeButtonText}>Confirm</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: '#ccc', marginTop: 10 }]}
              onPress={() => setShowCalibration(false)}
            >
              <Text style={[styles.closeButtonText, { color: '#333' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <RingSizer
        pixelsPerMM={pixelsPerMM}
        onSizeChange={handleDiameterChange}
        initialDiameter={lastDiameter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calibrateButton: {
    marginRight: 15,
  },
  calibrateButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  coinList: {
    maxHeight: '70%',
  },
  coinButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coinButtonText: {
    fontSize: 16,
  },
  coinDiameter: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedBackButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 
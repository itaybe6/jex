import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActionSheetIOS, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const diamondData = [
  {
    shape: 'Round',
    rows: [
      { mm: '4 mm', carat: '0.25 ct' },
      { mm: '5.0 mm', carat: '0.50 ct' },
      { mm: '5.75 mm', carat: '0.75 ct' },
      { mm: '6.5 mm', carat: '1.00 ct' },
      { mm: '6.8 mm', carat: '1.25 ct' },
      { mm: '7.3 mm', carat: '1.50 ct' },
      { mm: '7.75 mm', carat: '1.75 ct' },
      { mm: '8 mm', carat: '2.00 ct' },
      { mm: '8.7 mm', carat: '2.50 ct' },
      { mm: '9.1 mm', carat: '3.00 ct' },
      { mm: '9.75 mm', carat: '3.50 ct' },
      { mm: '10.25 mm', carat: '4.00 ct' },
      { mm: '10.75 mm', carat: '4.50 ct' },
      { mm: '11 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Princess',
    rows: [
      { mm: '3.25 mm', carat: '0.25 ct' },
      { mm: '4.5 mm', carat: '0.50 ct' },
      { mm: '5 mm', carat: '0.75 ct' },
      { mm: '5.5 mm', carat: '1.00 ct' },
      { mm: '6 mm', carat: '1.25 ct' },
      { mm: '6.5 mm', carat: '1.50 ct' },
      { mm: '6.75 mm', carat: '1.75 ct' },
      { mm: '7 mm', carat: '2.00 ct' },
      { mm: '7.5 mm', carat: '2.50 ct' },
      { mm: '8 mm', carat: '3.00 ct' },
      { mm: '8.5 mm', carat: '3.50 ct' },
      { mm: '8.75 mm', carat: '4.00 ct' },
      { mm: '9.25 mm', carat: '4.50 ct' },
      { mm: '9.5 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Cushion',
    rows: [
      { mm: '3.25 mm', carat: '0.25 ct' },
      { mm: '4.9 mm', carat: '0.50 ct' },
      { mm: '5.25 mm', carat: '0.75 ct' },
      { mm: '5.5 mm', carat: '1.00 ct' },
      { mm: '6 mm', carat: '1.25 ct' },
      { mm: '6.5 mm', carat: '1.50 ct' },
      { mm: '6.75 mm', carat: '1.75 ct' },
      { mm: '7 mm', carat: '2.00 ct' },
      { mm: '7.5 mm', carat: '2.50 ct' },
      { mm: '8 mm', carat: '3.00 ct' },
      { mm: '8.5 mm', carat: '3.50 ct' },
      { mm: '9 mm', carat: '4.00 ct' },
      { mm: '9.3 mm', carat: '4.50 ct' },
      { mm: '9.5 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Emerald',
    rows: [
      { mm: '4.3x3 mm', carat: '0.25 ct' },
      { mm: '6x4 mm', carat: '0.50 ct' },
      { mm: '6.5x4.5 mm', carat: '0.75 ct' },
      { mm: '7x5 mm', carat: '1.00 ct' },
      { mm: '7.3x5.3 mm', carat: '1.25 ct' },
      { mm: '7.5x5.5 mm', carat: '1.50 ct' },
      { mm: '8x6 mm', carat: '1.75 ct' },
      { mm: '8.5x6.5 mm', carat: '2.00 ct' },
      { mm: '9x7 mm', carat: '2.50 ct' },
      { mm: '9.3x7.5 mm', carat: '3.00 ct' },
      { mm: '9.75x7.7 mm', carat: '3.50 ct' },
      { mm: '10x8 mm', carat: '4.00 ct' },
      { mm: '10.5x8.5 mm', carat: '4.50 ct' },
      { mm: '11x9 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Marquise',
    rows: [
      { mm: '6x3 mm', carat: '0.25 ct' },
      { mm: '8x4 mm', carat: '0.50 ct' },
      { mm: '9x4.5 mm', carat: '0.75 ct' },
      { mm: '10x5 mm', carat: '1.00 ct' },
      { mm: '11x5.5 mm', carat: '1.25 ct' },
      { mm: '12x6 mm', carat: '1.50 ct' },
      { mm: '12.5x6.25 mm', carat: '1.75 ct' },
      { mm: '13x6.5 mm', carat: '2.00 ct' },
      { mm: '14x7 mm', carat: '2.50 ct' },
      { mm: '15x7 mm', carat: '3.00 ct' },
      { mm: '15x8 mm', carat: '3.50 ct' },
      { mm: '16.5x8.25 mm', carat: '4.00 ct' },
      { mm: '16.75x8.5 mm', carat: '4.50 ct' },
      { mm: '17x8.5 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Oval',
    rows: [
      { mm: '5x3 mm', carat: '0.25 ct' },
      { mm: '6x4 mm', carat: '0.50 ct' },
      { mm: '7x5 mm', carat: '0.75 ct' },
      { mm: '7.7x5.7 mm', carat: '1.00 ct' },
      { mm: '8x6 mm', carat: '1.25 ct' },
      { mm: '8.5x6.5 mm', carat: '1.50 ct' },
      { mm: '9x6.5 mm', carat: '1.75 ct' },
      { mm: '9x7 mm', carat: '2.00 ct' },
      { mm: '10x8 mm', carat: '2.50 ct' },
      { mm: '12x8 mm', carat: '3.00 ct' },
      { mm: '12x8.5 mm', carat: '3.50 ct' },
      { mm: '12.5x8.5 mm', carat: '4.00 ct' },
      { mm: '12.75x8.5 mm', carat: '4.50 ct' },
      { mm: '12x10 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Pear',
    rows: [
      { mm: '5x3 mm', carat: '0.25 ct' },
      { mm: '6x4 mm', carat: '0.50 ct' },
      { mm: '7x5 mm', carat: '0.75 ct' },
      { mm: '7.7x5.7 mm', carat: '1.00 ct' },
      { mm: '8x6 mm', carat: '1.25 ct' },
      { mm: '8.5x6.5 mm', carat: '1.50 ct' },
      { mm: '10x6 mm', carat: '1.75 ct' },
      { mm: '9x7 mm', carat: '2.00 ct' },
      { mm: '10x8 mm', carat: '2.50 ct' },
      { mm: '12x8 mm', carat: '3.00 ct' },
      { mm: '12x9 mm', carat: '3.50 ct' },
      { mm: '14x8 mm', carat: '4.00 ct' },
      { mm: '14.5x9 mm', carat: '4.50 ct' },
      { mm: '15x9 mm', carat: '5.00 ct' },
    ],
  },
  {
    shape: 'Radiant',
    rows: [
      { mm: '4.3x3 mm', carat: '0.25 ct' },
      { mm: '6x4 mm', carat: '0.50 ct' },
      { mm: '6.5x4.5 mm', carat: '0.75 ct' },
      { mm: '7x5 mm', carat: '1.00 ct' },
      { mm: '7.3x5.5 mm', carat: '1.25 ct' },
      { mm: '7.5x5.8 mm', carat: '1.50 ct' },
      { mm: '8x6 mm', carat: '1.75 ct' },
      { mm: '8.2x6.2 mm', carat: '2.00 ct' },
      { mm: '9x7 mm', carat: '2.50 ct' },
      { mm: '9.5x7.5 mm', carat: '3.00 ct' },
      { mm: '10x8 mm', carat: '3.50 ct' },
      { mm: '10.2x8.2 mm', carat: '4.00 ct' },
      { mm: '10.5x8.5 mm', carat: '4.50 ct' },
      { mm: '11x9 mm', carat: '5.00 ct' },
    ],
  },
];

export default function MMToCaratChartScreen() {
  const [selectedShape, setSelectedShape] = useState(diamondData[0].shape);
  const [modalVisible, setModalVisible] = useState(false);
  const shapeData = diamondData.find((d) => d.shape === selectedShape);

  const handleBack = () => {
    router.push('/(tabs)/tools');
  };

  const openPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: diamondData.map(d => d.shape).concat('Cancel'),
          cancelButtonIndex: diamondData.length,
        },
        (buttonIndex) => {
          if (buttonIndex >= 0 && buttonIndex < diamondData.length) {
            setSelectedShape(diamondData[buttonIndex].shape);
          }
        }
      );
    } else {
      setModalVisible(true);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.title}>MM to Carat</Text>
      </View>
      <Text style={styles.subtitle}>
        Use this chart to estimate a diamond's carat weight based on its millimeter size. Note that approximate conversions may vary slightly depending on diamond shape and cut proportions.
      </Text>
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Select diamond shape:</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={openPicker}>
          <Text style={styles.pickerButtonText}>{selectedShape}</Text>
        </TouchableOpacity>
      </View>
      {/* Modal for Android */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={diamondData}
              keyExtractor={item => item.shape}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedShape(item.shape);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.shape}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.tableScroll} contentContainerStyle={{ paddingBottom: 24 }}>
        {shapeData ? (
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>{shapeData.shape}</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeader}>MM Size</Text>
              <Text style={styles.tableHeader}>Carat Weight</Text>
            </View>
            {shapeData.rows.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{row.mm}</Text>
                <Text style={styles.tableCell}>{row.carat}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 24 }}>No data for selected shape</Text>
        )}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 0,
  },
  backButton: {
    marginRight: 8,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E2657',
    textAlign: 'center',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  pickerLabel: {
    fontSize: 15,
    color: '#0E2657',
    fontWeight: '500',
    marginRight: 8,
  },
  pickerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#0E2657',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: 350,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  modalItemText: {
    fontSize: 16,
    color: '#0E2657',
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 16,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableScroll: {
    maxHeight: 900,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 28,
    paddingVertical: 32,
    paddingHorizontal: 14,
    shadowColor: '#0E2657',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E2657',
    marginBottom: 10,
    textAlign: 'left',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1A237E',
    fontSize: 15,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4FF',
  },
  tableCell: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
  },
}); 
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';

const tools = [
  {
    label: 'Ring Sizer',
    icon: 'resize-outline',
    route: '/(tabs)/tools/ring-sizer',
  },
  {
    label: 'Custom Model Service',
    icon: 'cube-outline',
    route: '/(tabs)/tools/custom-model-service',
  },
  {
    label: 'MM to Carat Conversion Chart',
    icon: 'stats-chart-outline',
    route: '/(tabs)/tools/mm-to-carat-chart',
  },
];

const comingSoonCount = 3;

export default function ToolsScreen() {
  const [search, setSearch] = useState('');
  const filteredTools = tools.filter(tool =>
    tool.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tools</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7B8CA6" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tool..."
          placeholderTextColor="#7B8CA6"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.grid}>
        {filteredTools.map((tool, idx) => (
          <TouchableOpacity
            key={tool.label}
            style={styles.card}
            onPress={() => router.push(tool.route)}
            activeOpacity={0.85}
          >
            <Ionicons name={tool.icon as any} size={38} color="#0E2657" style={styles.cardIcon} />
            <Text style={styles.cardText}>{tool.label}</Text>
          </TouchableOpacity>
        ))}
        {/* Coming Soon cards */}
        {Array.from({ length: comingSoonCount }).map((_, idx) => (
          <View key={`coming-soon-${idx}`} style={[styles.card, styles.comingSoonCard]}>
            <Ionicons name="time-outline" size={38} color="#B2BEC3" style={styles.cardIcon} />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const CARD_GAP = 16;
const CARD_WIDTH = (Dimensions.get('window').width - 24 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0E2657',
    marginBottom: 24,
    alignSelf: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    marginHorizontal: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#0E2657',
    padding: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: CARD_GAP,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  comingSoonCard: {
    opacity: 0.5,
    backgroundColor: '#F6F7FA',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#B2BEC3',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
}); 
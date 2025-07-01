import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function CustomModelServiceScreen() {
  // WhatsApp number - ניתן לשינוי
  const whatsappNumber = '+972502307500'; // שנה למספר הרצוי
  
  const handleWhatsAppPress = async () => {
    const message = "Hello, I'm interested in receiving a custom model. Can you help me?";
    // wa.me דורש מספר בלי +
    const phone = whatsappNumber.replace('+', '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(whatsappUrl);
  };

  const handleBack = () => {
    router.push('/(tabs)/tools');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1, paddingBottom: 150 }]} keyboardShouldPersistTaps="handled">
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Model Service</Text>
      </View>
      <Text style={styles.subtitle}>
        We provide tailored 3D models and design services upon request. Whether you're looking for architecture, product models, or anything in between – we can help bring your vision to life.
      </Text>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Service Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cube-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.featureText}>3D Modeling</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="brush-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.featureText}>Custom Design</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="construct-outline" size={24} color="#6C5CE7" />
            </View>
            <Text style={styles.featureText}>Architecture</Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Ready to get started?</Text>
          <Text style={styles.contactSubtitle}>
            Contact us via WhatsApp to discuss your custom model requirements
          </Text>
          
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppPress}>
            <View style={styles.buttonContent}>
              <Ionicons name="logo-whatsapp" size={28} color="#fff" />
              <Text style={styles.buttonText}>Contact via WhatsApp</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0E2657',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E2657',
  },
  contactSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 150,
    marginTop: -40,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0E2657',
    textAlign: 'center',
    marginBottom: 5,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 
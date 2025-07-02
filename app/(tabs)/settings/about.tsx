import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
  const handleBack = () => {
    router.replace('/settings');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color="#0E2657" />
        </TouchableOpacity>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="diamond" size={40} color="#0E2657" />
            </View>
          </View>
          <Text style={styles.appName}>Brilliant</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={24} color="#0E2657" />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.sectionText}>
            At Brilliant, we believe everyone should have easy and secure access to the jewelry and precious stones market. 
            Our platform connects professional buyers and sellers, providing advanced tools for transaction management 
            and real-time market research.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#0E2657" />
            <Text style={styles.sectionTitle}>What We Offer</Text>
          </View>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#0E2657" />
              </View>
              <Text style={styles.featureTitle}>Advanced Security</Text>
              <Text style={styles.featureText}>Protect your information with advanced encryption technologies</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up" size={20} color="#0E2657" />
              </View>
              <Text style={styles.featureTitle}>Market Analysis</Text>
              <Text style={styles.featureText}>Advanced tools for analyzing trends and prices in real-time</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={20} color="#0E2657" />
              </View>
              <Text style={styles.featureTitle}>Professional Community</Text>
              <Text style={styles.featureText}>Connect with leading professionals in the industry</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="phone-portrait" size={20} color="#0E2657" />
              </View>
              <Text style={styles.featureTitle}>Mobile Experience</Text>
              <Text style={styles.featureText}>Convenient access from anywhere and anytime</Text>
            </View>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={24} color="#0E2657" />
            <Text style={styles.sectionTitle}>Our Team</Text>
          </View>
          <Text style={styles.sectionText}>
            Our team consists of technology experts, jewelry industry professionals, 
            and creative developers who are committed to creating the best experience for our users.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={24} color="#0E2657" />
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          
          <View style={styles.contactItems}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#0E2657" />
              <Text style={styles.contactText}>support@jexmobile.com</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#0E2657" />
              <Text style={styles.contactText}>+972-XX-XXX-XXXX</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#0E2657" />
              <Text style={styles.contactText}>Tel Aviv, Israel</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Brilliant. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(14,38,87,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginLeft: 12,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#4A5568',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 80) / 2 - 10,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0E2657',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
    textAlign: 'center',
    lineHeight: 16,
  },
  contactItems: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#4A5568',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
  },
}); 
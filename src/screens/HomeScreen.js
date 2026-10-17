import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏠 Rental Manager</Text>
      <Text style={styles.subtitle}>Manage your properties with ease</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Properties')}
        >
          <Text style={styles.cardIcon}>🏢</Text>
          <Text style={styles.cardText}>Properties</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Backup')}
        >
          <Text style={styles.cardIcon}>💾</Text>
          <Text style={styles.cardText}>Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {/* Will be accessible from property detail */}}
        >
          <Text style={styles.cardIcon}>⚡</Text>
          <Text style={styles.cardText}>Electricity</Text>
          <Text style={styles.cardHint}>via Property</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats placeholder */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoStep}>1. Add a Property (flat, shop, etc.)</Text>
        <Text style={styles.infoStep}>2. Add Tenants to the property</Text>
        <Text style={styles.infoStep}>3. Record monthly bills for each tenant</Text>
        <Text style={styles.infoStep}>4. Use Electricity Split for shared meters</Text>
        <Text style={styles.infoStep}>5. Track expenses per property</Text>
        <Text style={styles.infoStep}>6. Backup your data regularly!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F7',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A5276',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A5276',
    marginBottom: 10,
  },
  infoStep: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    paddingLeft: 5,
  },
});

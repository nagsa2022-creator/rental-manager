import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

export default function PropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

  async function loadProperties() {
    const db = await getDatabase();
    const results = await db.getAllAsync('SELECT * FROM properties ORDER BY created_at DESC');
    setProperties(results);
  }

  function getTypeLabel(type) {
    switch (type) {
      case 'residential': return 'Flat';
      case 'commercial': return 'Commercial';
      case 'shop': return 'Shop';
      case 'warehouse': return 'Warehouse';
      default: return 'Other';
    }
  }

  function renderProperty({ item }) {
    return (
      <TouchableOpacity
        style={styles.propertyCard}
        onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id, propertyName: item.name })}
      >
        <View style={styles.propertyIcon}>
          <Text style={styles.propertyIconText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyAddress}>{item.address || 'No address'}</Text>
          <Text style={styles.propertyType}>{getTypeLabel(item.type)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {properties.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No properties yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first property</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProperty}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProperty')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7' },
  list: { padding: 15 },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  propertyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A5276',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyIconText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  propertyInfo: { flex: 1 },
  propertyName: { fontSize: 16, fontWeight: '600', color: '#333' },
  propertyAddress: { fontSize: 13, color: '#666', marginTop: 2 },
  propertyType: { fontSize: 11, color: '#1A5276', marginTop: 4, textTransform: 'capitalize' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 5 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1A5276',
    justifyContent: 'center', alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});

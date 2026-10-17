import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

export default function PropertyDetailScreen({ route, navigation }) {
  const { propertyId, propertyName } = route.params;
  const [property, setProperty] = useState(null);
  const [tenantCount, setTenantCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [])
  );

  async function loadProperty() {
    const db = await getDatabase();
    const p = await db.getFirstAsync('SELECT * FROM properties WHERE id = ?', [propertyId]);
    setProperty(p);
    const count = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM tenants WHERE property_id = ? AND is_active = 1',
      [propertyId]
    );
    setTenantCount(count.count);
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Property?',
      'This will delete the property and ALL its tenants, bills, and expenses. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const db = await getDatabase();
            await db.execAsync(`
              DELETE FROM expenses WHERE property_id = ${propertyId};
              DELETE FROM electricity_readings WHERE property_id = ${propertyId};
              DELETE FROM bills WHERE property_id = ${propertyId};
              DELETE FROM tenants WHERE property_id = ${propertyId};
              DELETE FROM properties WHERE id = ${propertyId};
            `);
            navigation.goBack();
          }
        }
      ]
    );
  }

  if (!property) return null;

  function getTypeIcon(type) {
    switch (type) {
      case 'residential': return '🏠';
      case 'commercial': return '🏢';
      case 'shop': return '🛒';
      case 'warehouse': return '🏭';
      default: return '📦';
    }
  }

  return (
    <View style={styles.container}>
      {/* Property Info */}
      <View style={styles.infoCard}>
        <Text style={styles.icon}>{getTypeIcon(property.type)}</Text>
        <Text style={styles.name}>{property.name}</Text>
        <Text style={styles.type}>{property.type}</Text>
        {property.address ? <Text style={styles.address}>{property.address}</Text> : null}
        {property.upi_id ? <Text style={styles.upi}>UPI: {property.upi_id}</Text> : null}
        {property.lease_start ? (
          <Text style={styles.lease}>
            Lease: {property.lease_start} → {property.lease_end || '—'}
          </Text>
        ) : null}
        <Text style={styles.tenantCount}>{tenantCount} active tenant(s)</Text>
      </View>

      {/* Action Menu */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Tenants', { propertyId, propertyName })}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Tenants</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Electricity', { propertyId, propertyName })}
        >
          <Text style={styles.menuIcon}>⚡</Text>
          <Text style={styles.menuText}>Electricity Split</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ExpenseLog', { propertyId, propertyName })}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuText}>Expenses</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>🗑️ Delete Property</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 15 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', elevation: 2, marginBottom: 20,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  type: { fontSize: 13, color: '#1A5276', textTransform: 'capitalize', marginTop: 4 },
  address: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },
  upi: { fontSize: 12, color: '#888', marginTop: 4 },
  lease: { fontSize: 12, color: '#888', marginTop: 4 },
  tenantCount: { fontSize: 14, fontWeight: '600', color: '#1A5276', marginTop: 10 },
  menu: { backgroundColor: '#fff', borderRadius: 12, elevation: 1, marginBottom: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  menuIcon: { fontSize: 22, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: '#333' },
  menuArrow: { fontSize: 20, color: '#ccc' },
  deleteBtn: {
    padding: 14, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#E74C3C',
  },
  deleteBtnText: { fontSize: 14, color: '#E74C3C' },
});

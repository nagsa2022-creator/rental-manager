import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

export default function TenantsScreen({ route, navigation }) {
  const { propertyId, propertyName } = route.params;
  const [tenants, setTenants] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadTenants();
    }, [])
  );

  async function loadTenants() {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM tenants WHERE property_id = ? ORDER BY is_active DESC, name ASC',
      [propertyId]
    );
    setTenants(results);
  }

  function renderTenant({ item }) {
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_active && styles.cardInactive]}
        onPress={() => navigation.navigate('TenantDetail', {
          tenantId: item.id,
          tenantName: item.name,
          propertyId,
          propertyName,
        })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>
            {item.room_no ? `Room: ${item.room_no} • ` : ''}₹{item.rent_amount}/month
          </Text>
          <Text style={styles.phone}>{item.phone || 'No phone'}</Text>
        </View>
        {!item.is_active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Moved out</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {tenants.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyText}>No tenants yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add a tenant</Text>
        </View>
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTenant}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTenant', { propertyId, propertyName })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7' },
  list: { padding: 15 },
  card: {
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
  cardInactive: { opacity: 0.6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A5276',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  detail: { fontSize: 13, color: '#1A5276', marginTop: 2 },
  phone: { fontSize: 12, color: '#888', marginTop: 2 },
  inactiveBadge: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  inactiveBadgeText: { fontSize: 10, color: '#C0392B' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 5 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1A5276',
    justifyContent: 'center', alignItems: 'center',
    elevation: 5,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});

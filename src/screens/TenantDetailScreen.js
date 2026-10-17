import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TenantDetailScreen({ route, navigation }) {
  const { tenantId, tenantName, propertyId } = route.params;
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const db = await getDatabase();
    const t = await db.getFirstAsync('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    setTenant(t);
    const b = await db.getAllAsync(
      'SELECT * FROM bills WHERE tenant_id = ? ORDER BY year DESC, month DESC LIMIT 12',
      [tenantId]
    );
    setBills(b);
  }

  function getStatusColor(status) {
    if (status === 'paid') return '#27AE60';
    if (status === 'partial') return '#F39C12';
    return '#E74C3C';
  }

  function renderBill({ item }) {
    return (
      <TouchableOpacity
        style={styles.billCard}
        onPress={() => navigation.navigate('BillDetail', { billId: item.id, tenantName })}
      >
        <View style={styles.billMonth}>
          <Text style={styles.billMonthText}>{MONTHS[item.month - 1]}</Text>
          <Text style={styles.billYearText}>{item.year}</Text>
        </View>
        <View style={styles.billInfo}>
          <Text style={styles.billTotal}>₹{item.total.toLocaleString()}</Text>
          <Text style={styles.billBreakdown}>
            Rent: ₹{item.rent} | Elec: ₹{item.electricity} | Water: ₹{item.water}
          </Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.paid_status) }]}>
          <Text style={styles.statusText}>
            {item.paid_status === 'paid' ? '✓' : item.paid_status === 'partial' ? '◐' : '✗'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  async function handleMarkInactive() {
    Alert.alert(
      'Mark as moved out?',
      `${tenantName} will be marked as inactive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            const db = await getDatabase();
            await db.runAsync('UPDATE tenants SET is_active = 0 WHERE id = ?', [tenantId]);
            navigation.goBack();
          }
        }
      ]
    );
  }

  if (!tenant) return null;

  return (
    <View style={styles.container}>
      {/* Tenant Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Room/Shop:</Text>
          <Text style={styles.infoValue}>{tenant.room_no || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rent:</Text>
          <Text style={styles.infoValue}>₹{tenant.rent_amount}/month</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{tenant.phone || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Move-in:</Text>
          <Text style={styles.infoValue}>{tenant.move_in_date || '-'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddBill', { tenantId, tenantName, propertyId, rentAmount: tenant.rent_amount })}
        >
          <Text style={styles.actionBtnText}>+ Add Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('PayViaUPI', { tenantId, tenantName, propertyId })}
        >
          <Text style={styles.actionBtnText}>💳 Pay UPI</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={handleMarkInactive}
        >
          <Text style={[styles.actionBtnText, { color: '#C0392B' }]}>Move Out</Text>
        </TouchableOpacity>
      </View>

      {/* Payment History */}
      <Text style={styles.sectionTitle}>Payment History (Last 12 months)</Text>
      {bills.length === 0 ? (
        <Text style={styles.noBills}>No bills recorded yet</Text>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 15 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15,
    elevation: 2, marginBottom: 15,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8,
    alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#1A5276',
  },
  actionBtnDanger: { borderColor: '#C0392B' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#1A5276' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  noBills: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
  billCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1,
  },
  billMonth: { width: 45, alignItems: 'center', marginRight: 12 },
  billMonthText: { fontSize: 14, fontWeight: 'bold', color: '#1A5276' },
  billYearText: { fontSize: 11, color: '#888' },
  billInfo: { flex: 1 },
  billTotal: { fontSize: 15, fontWeight: '600', color: '#333' },
  billBreakdown: { fontSize: 11, color: '#888', marginTop: 2 },
  statusDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

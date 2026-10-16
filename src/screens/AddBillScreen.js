import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { getDatabase } from '../database/database';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AddBillScreen({ route, navigation }) {
  const { tenantId, tenantName, propertyId, rentAmount } = route.params;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rent, setRent] = useState(rentAmount ? rentAmount.toString() : '');
  const [electricity, setElectricity] = useState('');
  const [water, setWater] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [other, setOther] = useState('');
  const [otherDesc, setOtherDesc] = useState('');

  function getTotal() {
    return (parseFloat(rent) || 0) +
           (parseFloat(electricity) || 0) +
           (parseFloat(water) || 0) +
           (parseFloat(maintenance) || 0) +
           (parseFloat(other) || 0);
  }

  async function handleSave() {
    const total = getTotal();
    if (total === 0) {
      Alert.alert('Error', 'Please enter at least one amount');
      return;
    }

    const db = await getDatabase();

    // Check if bill already exists for this month
    const existing = await db.getFirstAsync(
      'SELECT id FROM bills WHERE tenant_id = ? AND month = ? AND year = ?',
      [tenantId, month, year]
    );
    if (existing) {
      Alert.alert('Exists', `Bill for ${MONTHS[month-1]} ${year} already exists for this tenant.`);
      return;
    }

    await db.runAsync(
      `INSERT INTO bills (tenant_id, property_id, month, year, rent, electricity, water, maintenance, other, other_description, total, paid_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
      [tenantId, propertyId, month, year,
       parseFloat(rent) || 0, parseFloat(electricity) || 0,
       parseFloat(water) || 0, parseFloat(maintenance) || 0,
       parseFloat(other) || 0, otherDesc.trim(), total]
    );

    Alert.alert('Success', `Bill of ₹${total} added for ${MONTHS[month-1]} ${year}`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Bill for: {tenantName}</Text>

      {/* Month/Year Selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity style={styles.monthBtn} onPress={() => setMonth(m => m > 1 ? m - 1 : 12)}>
          <Text style={styles.monthBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity style={styles.monthBtn} onPress={() => setMonth(m => m < 12 ? m + 1 : 1)}>
          <Text style={styles.monthBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Rent (₹)</Text>
      <TextInput style={styles.input} value={rent} onChangeText={setRent} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Electricity (₹)</Text>
      <TextInput style={styles.input} value={electricity} onChangeText={setElectricity} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Water (₹)</Text>
      <TextInput style={styles.input} value={water} onChangeText={setWater} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Maintenance (₹)</Text>
      <TextInput style={styles.input} value={maintenance} onChangeText={setMaintenance} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Other (₹)</Text>
      <TextInput style={styles.input} value={other} onChangeText={setOther} keyboardType="numeric" placeholder="0" />

      {parseFloat(other) > 0 && (
        <>
          <Text style={styles.label}>Other - Description</Text>
          <TextInput style={styles.input} value={otherDesc} onChangeText={setOtherDesc} placeholder="What is this for?" />
        </>
      )}

      {/* Total Display */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{getTotal().toLocaleString()}</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Bill</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 20 },
  header: { fontSize: 16, fontWeight: '600', color: '#1A5276', marginBottom: 10 },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, backgroundColor: '#fff', padding: 12, borderRadius: 8,
  },
  monthBtn: { padding: 10 },
  monthBtnText: { fontSize: 18, color: '#1A5276' },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  totalCard: {
    backgroundColor: '#1A5276', padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 20,
  },
  totalLabel: { color: '#acd', fontSize: 12 },
  totalValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  saveButton: {
    backgroundColor: '#27AE60', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 15,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

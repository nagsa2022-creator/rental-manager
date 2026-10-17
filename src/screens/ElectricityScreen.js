import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, FlatList
} from 'react-native';
import { getDatabase } from '../database/database';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ElectricityScreen({ route, navigation }) {
  const { propertyId, propertyName } = route.params;
  const now = new Date();

  const [tenants, setTenants] = useState([]);
  const [mainBill, setMainBill] = useState('');
  const [readings, setReadings] = useState({}); // { tenantId: { previous, current } }
  const [results, setResults] = useState(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    const db = await getDatabase();
    const t = await db.getAllAsync(
      'SELECT * FROM tenants WHERE property_id = ? AND is_active = 1 ORDER BY room_no, name',
      [propertyId]
    );
    setTenants(t);
    // Initialize readings object
    const r = {};
    t.forEach(tenant => {
      r[tenant.id] = { previous: '', current: '' };
    });
    setReadings(r);
  }

  function updateReading(tenantId, field, value) {
    setReadings(prev => ({
      ...prev,
      [tenantId]: { ...prev[tenantId], [field]: value }
    }));
  }

  function calculateSplit() {
    const bill = parseFloat(mainBill);
    if (!bill || bill <= 0) {
      Alert.alert('Error', 'Please enter the main meter bill amount');
      return;
    }

    let totalUnits = 0;
    const tenantUnits = [];

    for (const tenant of tenants) {
      const r = readings[tenant.id];
      const prev = parseFloat(r?.previous) || 0;
      const curr = parseFloat(r?.current) || 0;
      const units = curr - prev;

      if (units < 0) {
        Alert.alert('Error', `${tenant.name}: Current reading can't be less than previous`);
        return;
      }

      tenantUnits.push({ ...tenant, units, previous: prev, current: curr });
      totalUnits += units;
    }

    if (totalUnits === 0) {
      Alert.alert('Error', 'Total units used is 0. Please enter meter readings.');
      return;
    }

    // Calculate each tenant's share
    const splitResults = tenantUnits.map(t => ({
      ...t,
      share: Math.round((t.units / totalUnits) * bill),
      percentage: ((t.units / totalUnits) * 100).toFixed(1),
    }));

    setResults({ splitResults, totalUnits, bill });
  }

  async function saveSplit() {
    if (!results) return;

    const db = await getDatabase();
    for (const r of results.splitResults) {
      await db.runAsync(
        `INSERT OR REPLACE INTO electricity_readings 
         (property_id, tenant_id, month, year, previous_reading, current_reading, units_used, share_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [propertyId, r.id, month, year, r.previous, r.current, r.units, r.share]
      );
    }

    Alert.alert('Saved!', 'Electricity split saved for all tenants.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚡ Electricity Split</Text>
      <Text style={styles.subtitle}>{propertyName} • {MONTHS[month-1]} {year}</Text>

      {/* Main Bill */}
      <View style={styles.mainBillCard}>
        <Text style={styles.label}>Main Meter Bill Amount (₹)</Text>
        <TextInput
          style={styles.inputLarge}
          value={mainBill}
          onChangeText={setMainBill}
          keyboardType="numeric"
          placeholder="e.g. 3000"
        />
      </View>

      {/* Tenant Readings */}
      <Text style={styles.sectionTitle}>Sub-Meter Readings</Text>
      {tenants.map(tenant => (
        <View key={tenant.id} style={styles.readingCard}>
          <Text style={styles.tenantName}>
            {tenant.name} {tenant.room_no ? `(${tenant.room_no})` : ''}
          </Text>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.readingLabel}>Previous</Text>
              <TextInput
                style={styles.readingInput}
                value={readings[tenant.id]?.previous || ''}
                onChangeText={(v) => updateReading(tenant.id, 'previous', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.readingLabel}>Current</Text>
              <TextInput
                style={styles.readingInput}
                value={readings[tenant.id]?.current || ''}
                onChangeText={(v) => updateReading(tenant.id, 'current', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.readingLabel}>Units</Text>
              <Text style={styles.unitsDisplay}>
                {Math.max(0, (parseFloat(readings[tenant.id]?.current) || 0) - (parseFloat(readings[tenant.id]?.previous) || 0))}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calcButton} onPress={calculateSplit}>
        <Text style={styles.calcButtonText}>Calculate Split</Text>
      </TouchableOpacity>

      {/* Results */}
      {results && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>💡 Split Results</Text>
          <Text style={styles.resultsSummary}>
            Total Units: {results.totalUnits} | Bill: ₹{results.bill}
          </Text>
          {results.splitResults.map(r => (
            <View key={r.id} style={styles.resultRow}>
              <Text style={styles.resultName}>{r.name}</Text>
              <Text style={styles.resultUnits}>{r.units} units ({r.percentage}%)</Text>
              <Text style={styles.resultAmount}>₹{r.share}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.saveButton} onPress={saveSplit}>
            <Text style={styles.saveButtonText}>Save & Apply to Bills</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A5276', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  mainBillCard: {
    backgroundColor: '#FEF9E7', padding: 15, borderRadius: 10, marginBottom: 20,
    borderWidth: 1, borderColor: '#F9E79F',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputLarge: {
    backgroundColor: '#fff', borderRadius: 8, padding: 14,
    fontSize: 20, fontWeight: 'bold', borderWidth: 1, borderColor: '#ddd', textAlign: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  readingCard: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 1,
  },
  tenantName: { fontSize: 14, fontWeight: '600', color: '#1A5276', marginBottom: 8 },
  readingRow: { flexDirection: 'row', gap: 10 },
  readingField: { flex: 1 },
  readingLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  readingInput: {
    backgroundColor: '#F8F9FA', borderRadius: 6, padding: 8,
    fontSize: 14, borderWidth: 1, borderColor: '#eee', textAlign: 'center',
  },
  unitsDisplay: {
    backgroundColor: '#EBF5FB', borderRadius: 6, padding: 8,
    fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#1A5276',
  },
  calcButton: {
    backgroundColor: '#F39C12', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 15,
  },
  calcButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultsCard: {
    backgroundColor: '#EAFAF1', padding: 15, borderRadius: 10,
    marginTop: 20, borderWidth: 1, borderColor: '#A9DFBF',
  },
  resultsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E8449', marginBottom: 5 },
  resultsSummary: { fontSize: 12, color: '#666', marginBottom: 10 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#D5F5E3',
  },
  resultName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333' },
  resultUnits: { fontSize: 12, color: '#666', marginRight: 10 },
  resultAmount: { fontSize: 15, fontWeight: 'bold', color: '#1E8449' },
  saveButton: {
    backgroundColor: '#27AE60', padding: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

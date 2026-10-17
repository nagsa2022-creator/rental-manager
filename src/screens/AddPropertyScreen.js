import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { getDatabase } from '../database/database';

const PROPERTY_TYPES = [
  { key: 'residential', label: '🏠 Residential Flat' },
  { key: 'commercial', label: '🏢 Commercial Space' },
  { key: 'shop', label: '🛒 Shop' },
  { key: 'warehouse', label: '🏭 Warehouse' },
  { key: 'other', label: '📦 Other' },
];

export default function AddPropertyScreen({ navigation }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a property name');
      return;
    }
    if (!type) {
      Alert.alert('Required', 'Please select a property type');
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO properties (name, type, address, upi_id, lease_start, lease_end, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), type, address.trim(), upiId.trim(), leaseStart, leaseEnd, notes.trim()]
    );

    Alert.alert('Success', 'Property added!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Property Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Sunshine Apartments"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Property Type *</Text>
      <View style={styles.typeGrid}>
        {PROPERTY_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeChip, type === t.key && styles.typeChipActive]}
            onPress={() => setType(t.key)}
          >
            <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Full address"
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.label}>Your UPI ID (for GPay payments)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. yourname@okaxis"
        value={upiId}
        onChangeText={setUpiId}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Lease Start Date</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        value={leaseStart}
        onChangeText={setLeaseStart}
      />

      <Text style={styles.label}>Lease End Date</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        value={leaseEnd}
        onChangeText={setLeaseEnd}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Property</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F7',
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeChipActive: {
    backgroundColor: '#1A5276',
    borderColor: '#1A5276',
  },
  typeChipText: {
    fontSize: 13,
    color: '#333',
  },
  typeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1A5276',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

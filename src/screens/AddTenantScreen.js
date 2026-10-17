import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from 'react-native';
import { getDatabase } from '../database/database';

export default function AddTenantScreen({ route, navigation }) {
  const { propertyId } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [moveInDate, setMoveInDate] = useState('');

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter tenant name');
      return;
    }
    if (!rentAmount.trim()) {
      Alert.alert('Required', 'Please enter monthly rent amount');
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO tenants (property_id, name, phone, room_no, rent_amount, move_in_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [propertyId, name.trim(), phone.trim(), roomNo.trim(), parseFloat(rentAmount) || 0, moveInDate.trim()]
    );

    Alert.alert('Success', 'Tenant added!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tenant Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="10-digit mobile number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <Text style={styles.label}>Room / Shop Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 101, Shop-A"
        value={roomNo}
        onChangeText={setRoomNo}
      />

      <Text style={styles.label}>Monthly Rent (₹) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 8000"
        value={rentAmount}
        onChangeText={setRentAmount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Move-in Date</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        value={moveInDate}
        onChangeText={setMoveInDate}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Tenant</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#1A5276', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 25,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

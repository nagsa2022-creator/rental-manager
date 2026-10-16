import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { getDatabase } from '../database/database';

export default function PayViaUPIScreen({ route, navigation }) {
  const { tenantId, tenantName, propertyId } = route.params;
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(`Rent - ${tenantName}`);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDatabase();
    // Get property UPI ID
    const property = await db.getFirstAsync('SELECT upi_id FROM properties WHERE id = ?', [propertyId]);
    if (property?.upi_id) setUpiId(property.upi_id);

    // Get latest unpaid bill amount
    const now = new Date();
    const bill = await db.getFirstAsync(
      `SELECT total, paid_amount FROM bills 
       WHERE tenant_id = ? AND paid_status != 'paid'
       ORDER BY year DESC, month DESC LIMIT 1`,
      [tenantId]
    );
    if (bill) {
      const pending = bill.total - bill.paid_amount;
      setPendingAmount(pending);
      setAmount(pending.toString());
    }
  }

  function openGPay() {
    if (!upiId.trim()) {
      Alert.alert('Missing UPI ID', 'Please enter your UPI ID (set it in property settings)');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount');
      return;
    }

    // UPI deep link format - opens GPay/PhonePe/any UPI app
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent('Property Manager')}&am=${parseFloat(amount)}&tn=${encodeURIComponent(note.trim())}&cu=INR`;

    Linking.canOpenURL(upiUrl).then(supported => {
      if (supported) {
        Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          'UPI App Not Found',
          'No UPI payment app found. This feature works only on Android phone with GPay/PhonePe installed.',
          [{ text: 'OK' }]
        );
      }
    });
  }

  async function markAsPaid() {
    const db = await getDatabase();
    const now = new Date();
    await db.runAsync(
      `UPDATE bills SET paid_status = 'paid', paid_amount = total, paid_date = ?
       WHERE tenant_id = ? AND paid_status != 'paid'
       ORDER BY year DESC, month DESC LIMIT 1`,
      [now.toISOString().split('T')[0], tenantId]
    );
    Alert.alert('Done', 'Latest bill marked as paid!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 UPI Payment</Text>
      <Text style={styles.subtitle}>Tenant: {tenantName}</Text>

      {pendingAmount > 0 && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingLabel}>Pending Amount</Text>
          <Text style={styles.pendingValue}>₹{pendingAmount.toLocaleString()}</Text>
        </View>
      )}

      <Text style={styles.label}>Your UPI ID</Text>
      <TextInput
        style={styles.input}
        value={upiId}
        onChangeText={setUpiId}
        placeholder="e.g. yourname@okaxis"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Payment Note</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Rent payment"
      />

      <TouchableOpacity style={styles.gpayButton} onPress={openGPay}>
        <Text style={styles.gpayButtonText}>Open GPay / UPI App</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.markPaidButton} onPress={markAsPaid}>
        <Text style={styles.markPaidButtonText}>✓ Mark as Paid</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: "Open GPay" will work only on your Android phone (not in browser preview).
        It opens any UPI app with pre-filled amount.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A5276', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  pendingCard: {
    backgroundColor: '#FDEDEC', padding: 15, borderRadius: 10,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#F5B7B1',
  },
  pendingLabel: { fontSize: 12, color: '#C0392B' },
  pendingValue: { fontSize: 24, fontWeight: 'bold', color: '#C0392B', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  gpayButton: {
    backgroundColor: '#4285F4', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 25,
  },
  gpayButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  markPaidButton: {
    backgroundColor: '#27AE60', padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 12,
  },
  markPaidButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  note: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 20, lineHeight: 16 },
});

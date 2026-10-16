import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/database';

export default function BackupScreen() {
  const [status, setStatus] = useState('');

  async function exportData() {
    try {
      setStatus('Exporting...');
      const db = await getDatabase();

      const properties = await db.getAllAsync('SELECT * FROM properties');
      const tenants = await db.getAllAsync('SELECT * FROM tenants');
      const bills = await db.getAllAsync('SELECT * FROM bills');
      const electricity = await db.getAllAsync('SELECT * FROM electricity_readings');
      const expenses = await db.getAllAsync('SELECT * FROM expenses');

      const backup = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        data: { properties, tenants, bills, electricity_readings: electricity, expenses }
      };

      const json = JSON.stringify(backup, null, 2);
      const fileName = `RentalManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Save Backup File',
        });
      }

      setStatus(`✅ Exported: ${properties.length} properties, ${tenants.length} tenants, ${bills.length} bills`);
    } catch (error) {
      setStatus(`❌ Export failed: ${error.message}`);
    }
  }

  async function importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setStatus('Importing...');
      const fileUri = result.assets[0].uri;
      const json = await FileSystem.readAsStringAsync(fileUri);
      const backup = JSON.parse(json);

      if (!backup.version || !backup.data) {
        Alert.alert('Invalid File', 'This is not a valid Rental Manager backup file.');
        return;
      }

      Alert.alert(
        'Restore Backup?',
        `This will REPLACE all current data with:\n• ${backup.data.properties?.length || 0} properties\n• ${backup.data.tenants?.length || 0} tenants\n• ${backup.data.bills?.length || 0} bills\n\nThis cannot be undone!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => restoreData(backup.data),
          }
        ]
      );
    } catch (error) {
      setStatus(`❌ Import failed: ${error.message}`);
    }
  }

  async function restoreData(data) {
    try {
      const db = await getDatabase();

      // Clear existing data
      await db.execAsync(`
        DELETE FROM expenses;
        DELETE FROM electricity_readings;
        DELETE FROM bills;
        DELETE FROM tenants;
        DELETE FROM properties;
      `);

      // Restore properties
      for (const p of (data.properties || [])) {
        await db.runAsync(
          'INSERT INTO properties (id, name, type, address, upi_id, lease_start, lease_end, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
          [p.id, p.name, p.type, p.address, p.upi_id, p.lease_start, p.lease_end, p.notes, p.created_at]
        );
      }

      // Restore tenants
      for (const t of (data.tenants || [])) {
        await db.runAsync(
          'INSERT INTO tenants (id, property_id, name, phone, room_no, rent_amount, move_in_date, is_active, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
          [t.id, t.property_id, t.name, t.phone, t.room_no, t.rent_amount, t.move_in_date, t.is_active, t.created_at]
        );
      }

      // Restore bills
      for (const b of (data.bills || [])) {
        await db.runAsync(
          'INSERT INTO bills (id, tenant_id, property_id, month, year, rent, electricity, water, maintenance, other, other_description, total, paid_amount, paid_status, paid_date, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [b.id, b.tenant_id, b.property_id, b.month, b.year, b.rent, b.electricity, b.water, b.maintenance, b.other, b.other_description, b.total, b.paid_amount, b.paid_status, b.paid_date, b.created_at]
        );
      }

      // Restore electricity readings
      for (const e of (data.electricity_readings || [])) {
        await db.runAsync(
          'INSERT INTO electricity_readings (id, property_id, tenant_id, month, year, previous_reading, current_reading, units_used, share_amount) VALUES (?,?,?,?,?,?,?,?,?)',
          [e.id, e.property_id, e.tenant_id, e.month, e.year, e.previous_reading, e.current_reading, e.units_used, e.share_amount]
        );
      }

      // Restore expenses
      for (const e of (data.expenses || [])) {
        await db.runAsync(
          'INSERT INTO expenses (id, property_id, date, category, amount, description, created_at) VALUES (?,?,?,?,?,?,?)',
          [e.id, e.property_id, e.date, e.category, e.amount, e.description, e.created_at]
        );
      }

      setStatus(`✅ Restored successfully!`);
    } catch (error) {
      setStatus(`❌ Restore failed: ${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💾 Backup & Restore</Text>
      <Text style={styles.subtitle}>Keep your data safe</Text>

      <TouchableOpacity style={styles.exportBtn} onPress={exportData}>
        <Text style={styles.exportIcon}>📤</Text>
        <View>
          <Text style={styles.btnTitle}>Export Backup</Text>
          <Text style={styles.btnDesc}>Save all data as a JSON file</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.importBtn} onPress={importData}>
        <Text style={styles.exportIcon}>📥</Text>
        <View>
          <Text style={styles.btnTitle}>Import / Restore</Text>
          <Text style={styles.btnDesc}>Load a previously saved backup file</Text>
        </View>
      </TouchableOpacity>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <Text style={styles.tip}>
        💡 Tip: Export regularly and save the file to Google Drive or WhatsApp (send to yourself) for safekeeping.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A5276', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 30 },
  exportBtn: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 12,
    alignItems: 'center', elevation: 2, marginBottom: 15, gap: 15,
  },
  importBtn: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 12,
    alignItems: 'center', elevation: 2, marginBottom: 15, gap: 15,
  },
  exportIcon: { fontSize: 32 },
  btnTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  btnDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  statusCard: {
    backgroundColor: '#EBF5FB', padding: 15, borderRadius: 10, marginTop: 20,
  },
  statusText: { fontSize: 13, color: '#333', textAlign: 'center' },
  tip: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 30, lineHeight: 18 },
});

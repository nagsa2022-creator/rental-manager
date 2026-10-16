import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    expectedIncome: 0,
    collected: 0,
    pending: 0,
    recentBills: [],
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    const db = await getDatabase();

    const properties = await db.getFirstAsync('SELECT COUNT(*) as count FROM properties');
    const tenants = await db.getFirstAsync('SELECT COUNT(*) as count FROM tenants WHERE is_active = 1');
    const expectedIncome = await db.getFirstAsync(
      'SELECT COALESCE(SUM(rent_amount), 0) as total FROM tenants WHERE is_active = 1'
    );

    const monthBills = await db.getFirstAsync(
      `SELECT COALESCE(SUM(total), 0) as billed, COALESCE(SUM(paid_amount), 0) as collected
       FROM bills WHERE month = ? AND year = ?`,
      [currentMonth, currentYear]
    );

    const recentBills = await db.getAllAsync(
      `SELECT b.*, t.name as tenant_name FROM bills b
       JOIN tenants t ON b.tenant_id = t.id
       ORDER BY b.created_at DESC LIMIT 5`
    );

    setStats({
      totalProperties: properties.count,
      totalTenants: tenants.count,
      expectedIncome: expectedIncome.total,
      collected: monthBills.collected,
      pending: monthBills.billed - monthBills.collected,
      recentBills,
    });
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Dashboard</Text>
      <Text style={styles.subtitle}>{MONTHS[currentMonth - 1]} {currentYear}</Text>

      {/* Summary Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.statCard, { backgroundColor: '#EBF5FB' }]}>
          <Text style={styles.statValue}>{stats.totalProperties}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF9E7' }]}>
          <Text style={styles.statValue}>{stats.totalTenants}</Text>
          <Text style={styles.statLabel}>Tenants</Text>
        </View>
      </View>

      {/* Income Card */}
      <View style={styles.incomeCard}>
        <Text style={styles.incomeTitle}>Monthly Income</Text>
        <Text style={styles.incomeExpected}>
          Expected: ₹{stats.expectedIncome.toLocaleString()}
        </Text>
        <View style={styles.incomeRow}>
          <View style={styles.incomeItem}>
            <Text style={[styles.incomeValue, { color: '#27AE60' }]}>
              ₹{stats.collected.toLocaleString()}
            </Text>
            <Text style={styles.incomeLabel}>Collected</Text>
          </View>
          <View style={styles.incomeDivider} />
          <View style={styles.incomeItem}>
            <Text style={[styles.incomeValue, { color: '#E74C3C' }]}>
              ₹{stats.pending.toLocaleString()}
            </Text>
            <Text style={styles.incomeLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Bills</Text>
      {stats.recentBills.length === 0 ? (
        <Text style={styles.noData}>No bills recorded yet</Text>
      ) : (
        stats.recentBills.map(bill => (
          <View key={bill.id} style={styles.billRow}>
            <View style={styles.billInfo}>
              <Text style={styles.billName}>{bill.tenant_name}</Text>
              <Text style={styles.billDate}>
                {MONTHS[bill.month - 1]} {bill.year} • ₹{bill.total}
              </Text>
            </View>
            <View style={[
              styles.billStatus,
              { backgroundColor: bill.paid_status === 'paid' ? '#EAFAF1' : '#FDEDEC' }
            ]}>
              <Text style={{
                fontSize: 11, fontWeight: '600',
                color: bill.paid_status === 'paid' ? '#27AE60' : '#E74C3C'
              }}>
                {bill.paid_status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7', padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A5276', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  statCard: {
    flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', elevation: 1,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#1A5276' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  incomeCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    elevation: 2, marginBottom: 20,
  },
  incomeTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  incomeExpected: { fontSize: 12, color: '#888', marginBottom: 15 },
  incomeRow: { flexDirection: 'row', alignItems: 'center' },
  incomeItem: { flex: 1, alignItems: 'center' },
  incomeDivider: { width: 1, height: 40, backgroundColor: '#eee' },
  incomeValue: { fontSize: 20, fontWeight: 'bold' },
  incomeLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  noData: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 10 },
  billRow: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1,
  },
  billInfo: { flex: 1 },
  billName: { fontSize: 14, fontWeight: '500', color: '#333' },
  billDate: { fontSize: 12, color: '#888', marginTop: 2 },
  billStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
});

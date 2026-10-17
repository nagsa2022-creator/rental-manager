import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Alert, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

const CATEGORIES = ['Repair', 'Painting', 'Plumbing', 'Electrical', 'Furniture', 'Tax', 'Insurance', 'Other'];

export default function ExpenseLogScreen({ route }) {
  const { propertyId, propertyName } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  async function loadExpenses() {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM expenses WHERE property_id = ? ORDER BY date DESC',
      [propertyId]
    );
    setExpenses(results);
    const total = results.reduce((sum, e) => sum + e.amount, 0);
    setTotalExpenses(total);
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO expenses (property_id, date, category, amount, description) VALUES (?, ?, ?, ?, ?)',
      [propertyId, date, category, parseFloat(amount), description.trim()]
    );

    setShowModal(false);
    setAmount(''); setCategory(''); setDescription('');
    loadExpenses();
  }

  async function handleDelete(id) {
    Alert.alert('Delete?', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
          loadExpenses();
        }
      }
    ]);
  }

  function renderExpense({ item }) {
    return (
      <TouchableOpacity style={styles.expenseCard} onLongPress={() => handleDelete(item.id)}>
        <View style={styles.expenseIcon}>
          <Text style={styles.expenseIconText}>
            {item.category === 'Repair' ? '🔧' : item.category === 'Painting' ? '🎨' :
             item.category === 'Plumbing' ? '🚰' : item.category === 'Electrical' ? '💡' :
             item.category === 'Tax' ? '📋' : '📦'}
          </Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseDesc}>{item.description || 'No description'}</Text>
          <Text style={styles.expenseDate}>{item.date}</Text>
        </View>
        <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>₹{totalExpenses.toLocaleString()}</Text>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No expenses recorded</Text>
          <Text style={styles.emptySubtext}>Long-press to delete an expense</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExpense}
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            <Text style={styles.label}>Amount (₹) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="What was this for?" />

            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F7' },
  totalCard: {
    backgroundColor: '#1A5276', padding: 20, margin: 15,
    borderRadius: 12, alignItems: 'center',
  },
  totalLabel: { color: '#acd', fontSize: 12 },
  totalValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  list: { padding: 15, paddingTop: 0 },
  expenseCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1,
  },
  expenseIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F6F7', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  expenseIconText: { fontSize: 18 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 14, fontWeight: '600', color: '#333' },
  expenseDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  expenseDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: 'bold', color: '#C0392B' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  emptySubtext: { fontSize: 12, color: '#999', marginTop: 5 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A5276',
    justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#eee' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#F4F6F7', borderWidth: 1, borderColor: '#ddd' },
  categoryChipActive: { backgroundColor: '#1A5276', borderColor: '#1A5276' },
  categoryText: { fontSize: 12, color: '#333' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F4F6F7', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#666' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1A5276', alignItems: 'center' },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});

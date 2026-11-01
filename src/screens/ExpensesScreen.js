import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import { getExpenses, saveExpense, deleteExpense, getCategories, addCategory, getAllProperties } from '../database/queries';
import SearchBar from '../components/SearchBar';

const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function ExpensesScreen({ route, navigation }) {
  const filterPropertyId = route.params?.property_id;
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', paid_by: '', property_id: filterPropertyId, notes: '' });
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    setExpenses(await getExpenses(filterPropertyId));
    setCategories(await getCategories());
    if (!filterPropertyId) setProperties(await getAllProperties());
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = expenses.filter(e =>
    (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.category || !form.amount || !form.property_id) {
      Alert.alert('Required', 'Property, category, and amount are required');
      return;
    }
    const prop = properties.find(p => p.id === form.property_id);
    await saveExpense({ ...form, amount: parseFloat(form.amount), owner_id: prop?.owner_id || route.params?.owner_id || 0 });
    setShowAdd(false);
    setForm({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', paid_by: '', property_id: filterPropertyId, notes: '' });
    load();
  };

  const handleAddCategory = async () => {
    if (newCat.trim()) {
      await addCategory(newCat.trim());
      setNewCat('');
      setCategories(await getCategories());
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(id); load(); } }
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={CARD_STYLE} onLongPress={() => handleDelete(item.id)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <Text style={FONTS.subtitle}>{item.category}</Text>
        <Text style={{ ...FONTS.subtitle, color: COLORS.danger }}>{fmt(item.amount)}</Text>
      </View>
      {item.description ? <Text style={FONTS.body}>{item.description}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs }}>
        <Text style={FONTS.caption}>{item.date}</Text>
        <Text style={FONTS.caption}>{item.property_name || ''}</Text>
      </View>
      {item.paid_by ? <Text style={FONTS.small}>Paid by: {item.paid_by}</Text> : null}
    </TouchableOpacity>
  );

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search expenses..." />
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
        <Text style={FONTS.caption}>Total: <Text style={{ color: COLORS.danger }}>{fmt(total)}</Text></Text>
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0 }}
        ListEmptyComponent={<Text style={{ ...FONTS.caption, textAlign: 'center', marginTop: 40 }}>No expenses recorded</Text>} />

      {/* FAB */}
      <TouchableOpacity style={{ position: 'absolute', right: 20, bottom: 20, width: 52, height: 52, borderRadius: 26,
        backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center', elevation: 5 }}
        onPress={() => setShowAdd(true)}>
        <Text style={{ color: COLORS.white, fontSize: 28, lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: COLORS.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%', padding: SPACING.xl }}>
            <Text style={{ ...FONTS.title, marginBottom: SPACING.lg }}>Add Expense</Text>

            {!filterPropertyId && (
              <>
                <Text style={FONTS.caption}>Property *</Text>
                <ScrollView horizontal style={{ marginBottom: SPACING.md }}>
                  {properties.map(p => (
                    <TouchableOpacity key={p.id} onPress={() => setForm({ ...form, property_id: p.id })}
                      style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm, borderRadius: 6,
                        backgroundColor: form.property_id === p.id ? COLORS.primaryDark : COLORS.cardAlt, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ color: form.property_id === p.id ? COLORS.white : COLORS.text, fontSize: 13 }}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={FONTS.caption}>Category *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.sm }}>
              {categories.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setForm({ ...form, category: c.name })}
                  style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginRight: SPACING.xs, marginBottom: SPACING.xs, borderRadius: 6,
                    backgroundColor: form.category === c.name ? COLORS.primaryDark : COLORS.cardAlt, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ color: form.category === c.name ? COLORS.white : COLORS.text, fontSize: 12 }}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', marginBottom: SPACING.md }}>
              <TextInput style={{ ...INPUT_STYLE, flex: 1, marginRight: SPACING.sm }} placeholder="New category" placeholderTextColor={COLORS.textMuted}
                value={newCat} onChangeText={setNewCat} />
              <TouchableOpacity style={{ ...BTN.primary, justifyContent: 'center' }} onPress={handleAddCategory}>
                <Text style={BTN.text}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={FONTS.caption}>Amount *</Text>
            <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.md }} keyboardType="numeric" placeholder="0"
              placeholderTextColor={COLORS.textMuted} value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} />

            <Text style={FONTS.caption}>Date</Text>
            <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.md }} placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted} value={form.date} onChangeText={v => setForm({ ...form, date: v })} />

            <Text style={FONTS.caption}>Description</Text>
            <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.md }} placeholder="What was it for?"
              placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={v => setForm({ ...form, description: v })} />

            <Text style={FONTS.caption}>Paid By</Text>
            <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.lg }} placeholder="Owner / Manager / Tenant"
              placeholderTextColor={COLORS.textMuted} value={form.paid_by} onChangeText={v => setForm({ ...form, paid_by: v })} />

            <TouchableOpacity style={{ ...BTN.primary, marginBottom: SPACING.md }} onPress={handleSave}>
              <Text style={BTN.text}>Save Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: SPACING.md, marginBottom: SPACING.xl }} onPress={() => setShowAdd(false)}>
              <Text style={{ color: COLORS.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

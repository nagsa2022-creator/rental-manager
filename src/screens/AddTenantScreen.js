import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, Modal, FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import {
  getAllProperties, getRoomsByProperty, getTenant,
  saveTenant, getDeposit, saveDeposit,
} from '../database/queries';

const EMPTY_FORM = {
  name: '', phone: '', property_id: null, room_id: null,
  monthly_rent: '', rent_due_day: '5', move_in_date: null,
  deposit_amount: '', deposit_date: null, notes: '',
};

function SelectField({ label, value, items, onSelect, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.value === value);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.input, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setOpen(true)} activeOpacity={0.7}>
        <Text style={{ color: selected ? COLORS.text : COLORS.textMuted, fontSize: 14 }}>
          {selected ? selected.label : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modal}>
            <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>{label}</Text>
            <FlatList
              data={[{ label: placeholder, value: null }, ...items]}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option}
                  onPress={() => { onSelect(item.value); setOpen(false); }}>
                  <Text style={{
                    color: item.value === value ? COLORS.primary : COLORS.text,
                    fontWeight: item.value === value ? '600' : '400', fontSize: 14,
                  }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function AddTenantScreen({ route, navigation }) {
  const editId = route.params?.id ?? null;
  const prefillPropertyId = route.params?.property_id ?? null;

  const [form, setForm] = useState({ ...EMPTY_FORM, property_id: prefillPropertyId });
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showMoveInPicker, setShowMoveInPicker] = useState(false);
  const [showDepositDatePicker, setShowDepositDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Edit Tenant' : 'Add Tenant' });
    loadProperties();
    if (editId) loadExisting(editId);
  }, []);

  useEffect(() => {
    if (form.property_id) loadRooms(form.property_id);
    else setRooms([]);
  }, [form.property_id]);

  const loadProperties = async () => setProperties(await getAllProperties());
  const loadRooms = async (pid) => setRooms(await getRoomsByProperty(pid));

  const loadExisting = async (id) => {
    const tenant = await getTenant(id);
    const deposit = await getDeposit(id);
    if (tenant) {
      setForm({
        name: tenant.name ?? '', phone: tenant.phone ?? '',
        property_id: tenant.property_id ?? null, room_id: tenant.room_id ?? null,
        monthly_rent: String(tenant.monthly_rent ?? ''),
        rent_due_day: String(tenant.rent_due_day ?? '5'),
        move_in_date: tenant.move_in_date ? new Date(tenant.move_in_date) : null,
        deposit_amount: deposit ? String(deposit.amount_collected ?? '') : '',
        deposit_date: deposit?.date_collected ? new Date(deposit.date_collected) : null,
        notes: tenant.notes ?? '',
      });
    }
  };

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const formatDate = (date) => date ? date.toISOString().split('T')[0] : '';

  const validate = () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Tenant name is required.'); return false; }
    const day = parseInt(form.rent_due_day, 10);
    if (isNaN(day) || day < 1 || day > 28) { Alert.alert('Validation', 'Rent due day must be 1-28.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const tenantId = await saveTenant({
        id: editId, name: form.name.trim(), phone: form.phone.trim(),
        property_id: form.property_id, room_id: form.room_id,
        monthly_rent: parseFloat(form.monthly_rent) || 0,
        rent_due_day: parseInt(form.rent_due_day, 10),
        move_in_date: formatDate(form.move_in_date), notes: form.notes.trim(),
      });
      if (form.deposit_amount) {
        await saveDeposit({
          tenant_id: tenantId,
          amount_collected: parseFloat(form.deposit_amount) || 0,
          date_collected: formatDate(form.deposit_date),
          status: 'held',
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const propertyItems = properties.map(p => ({ label: p.name, value: p.id }));
  const roomItems = rooms.map(r => ({ label: r.name, value: r.id }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.label}>Name <Text style={{ color: COLORS.danger }}>*</Text></Text>
      <TextInput style={styles.input} value={form.name}
        onChangeText={v => set('name', v)} placeholder="Full name"
        placeholderTextColor={COLORS.textMuted} />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={form.phone}
        onChangeText={v => set('phone', v)} placeholder="e.g. 9876543210"
        placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" />

      <SelectField label="Property" value={form.property_id} items={propertyItems}
        placeholder="-- Select property --"
        onSelect={v => { set('property_id', v); set('room_id', null); }} />

      <SelectField label="Room" value={form.room_id} items={roomItems}
        placeholder={rooms.length ? '-- Select room --' : '-- Select property first --'}
        onSelect={v => set('room_id', v)} disabled={rooms.length === 0} />

      <Text style={styles.label}>Monthly Rent (Rs)</Text>
      <TextInput style={styles.input} value={form.monthly_rent}
        onChangeText={v => set('monthly_rent', v)} placeholder="e.g. 8000"
        placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />

      <Text style={styles.label}>Rent Due Day (1-28)</Text>
      <TextInput style={styles.input} value={form.rent_due_day}
        onChangeText={v => set('rent_due_day', v)} placeholder="e.g. 5"
        placeholderTextColor={COLORS.textMuted} keyboardType="numeric" maxLength={2} />

      <Text style={styles.label}>Move-in Date</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowMoveInPicker(true)}>
        <Text style={{ color: form.move_in_date ? COLORS.text : COLORS.textMuted, fontSize: 14 }}>
          {form.move_in_date ? formatDate(form.move_in_date) : 'Select date'}
        </Text>
      </TouchableOpacity>
      {showMoveInPicker && (
        <DateTimePicker value={form.move_in_date ?? new Date()} mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => { setShowMoveInPicker(false); if (date) set('move_in_date', date); }} />
      )}

      <View style={{ borderBottomWidth: 1, borderColor: COLORS.border, marginTop: SPACING.lg, marginBottom: SPACING.xs, paddingBottom: SPACING.xs }}>
        <Text style={{ ...FONTS.body, color: COLORS.primary, fontWeight: '600' }}>Security Deposit</Text>
      </View>

      <Text style={styles.label}>Amount (Rs)</Text>
      <TextInput style={styles.input} value={form.deposit_amount}
        onChangeText={v => set('deposit_amount', v)} placeholder="e.g. 16000"
        placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />

      <Text style={styles.label}>Deposit Date</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDepositDatePicker(true)}>
        <Text style={{ color: form.deposit_date ? COLORS.text : COLORS.textMuted, fontSize: 14 }}>
          {form.deposit_date ? formatDate(form.deposit_date) : 'Select date'}
        </Text>
      </TouchableOpacity>
      {showDepositDatePicker && (
        <DateTimePicker value={form.deposit_date ?? new Date()} mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => { setShowDepositDatePicker(false); if (date) set('deposit_date', date); }} />
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={form.notes}
        onChangeText={v => set('notes', v)} placeholder="Any additional notes..."
        placeholderTextColor={COLORS.textMuted} multiline textAlignVertical="top" />

      <TouchableOpacity style={[BTN.primary, { marginTop: SPACING.xl }, saving && { opacity: 0.6 }]}
        onPress={handleSave} disabled={saving} activeOpacity={0.8}>
        <Text style={BTN.text}>{saving ? 'Saving...' : 'Save Tenant'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 60 },
  label: { ...FONTS.small, color: COLORS.textMuted, marginTop: SPACING.md, marginBottom: 4 },
  input: { ...INPUT_STYLE },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.xl },
  modal: { backgroundColor: COLORS.cardAlt, borderRadius: 10, padding: SPACING.lg, maxHeight: '60%',
    borderWidth: 1, borderColor: COLORS.border },
  option: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import {
  getAllProperties,
  getRoomsByProperty,
  getTenant,
  saveTenant,
  getDeposit,
  saveDeposit,
} from '../database/queries';

const EMPTY_FORM = {
  name: '',
  phone: '',
  property_id: null,
  room_id: null,
  monthly_rent: '',
  rent_due_day: '5',
  move_in_date: null,
  deposit_amount: '',
  deposit_date: null,
  notes: '',
};

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

  // Reload rooms when property changes
  useEffect(() => {
    if (form.property_id) loadRooms(form.property_id);
    else setRooms([]);
  }, [form.property_id]);

  const loadProperties = async () => {
    const data = await getAllProperties();
    setProperties(data);
  };

  const loadRooms = async (propertyId) => {
    const data = await getRoomsByProperty(propertyId);
    setRooms(data);
  };

  const loadExisting = async (id) => {
    const tenant = await getTenant(id);
    const deposit = await getDeposit(id);
    if (tenant) {
      setForm({
        name: tenant.name ?? '',
        phone: tenant.phone ?? '',
        property_id: tenant.property_id ?? null,
        room_id: tenant.room_id ?? null,
        monthly_rent: String(tenant.monthly_rent ?? ''),
        rent_due_day: String(tenant.rent_due_day ?? '5'),
        move_in_date: tenant.move_in_date ? new Date(tenant.move_in_date) : null,
        deposit_amount: deposit ? String(deposit.amount ?? '') : '',
        deposit_date: deposit?.date ? new Date(deposit.date) : null,
        notes: tenant.notes ?? '',
      });
    }
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const formatDate = (date) =>
    date ? date.toISOString().split('T')[0] : '';

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Tenant name is required.');
      return false;
    }
    const day = parseInt(form.rent_due_day, 10);
    if (isNaN(day) || day < 1 || day > 28) {
      Alert.alert('Validation', 'Rent due day must be between 1 and 28.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        id: editId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        property_id: form.property_id,
        room_id: form.room_id,
        monthly_rent: parseFloat(form.monthly_rent) || 0,
        rent_due_day: parseInt(form.rent_due_day, 10),
        move_in_date: formatDate(form.move_in_date),
        notes: form.notes.trim(),
        status: 'active',
      };
      const tenantId = await saveTenant(payload);

      if (form.deposit_amount) {
        await saveDeposit({
          tenant_id: tenantId,
          amount: parseFloat(form.deposit_amount) || 0,
          date: formatDate(form.deposit_date),
        });
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save tenant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Name */}
      <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => set('name', v)}
        placeholder="Full name"
        placeholderTextColor={COLORS.textMuted}
      />

      {/* Phone */}
      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        placeholder="e.g. 9876543210"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="phone-pad"
      />

      {/* Property Picker */}
      <Text style={styles.label}>Property</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.property_id}
          onValueChange={(v) => {
            set('property_id', v);
            set('room_id', null);
          }}
          style={styles.picker}
          dropdownIconColor={COLORS.textMuted}
        >
          <Picker.Item label="-- Select property --" value={null} />
          {properties.map((p) => (
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          ))}
        </Picker>
      </View>

      {/* Room Picker — updates when property changes */}
      <Text style={styles.label}>Room</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.room_id}
          onValueChange={(v) => set('room_id', v)}
          style={styles.picker}
          dropdownIconColor={COLORS.textMuted}
          enabled={rooms.length > 0}
        >
          <Picker.Item label={rooms.length ? '-- Select room --' : '-- Select property first --'} value={null} />
          {rooms.map((r) => (
            <Picker.Item key={r.id} label={r.label ?? r.name} value={r.id} />
          ))}
        </Picker>
      </View>

      {/* Monthly Rent */}
      <Text style={styles.label}>Monthly Rent (Rs)</Text>
      <TextInput
        style={styles.input}
        value={form.monthly_rent}
        onChangeText={(v) => set('monthly_rent', v)}
        placeholder="e.g. 8000"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
      />

      {/* Rent Due Day */}
      <Text style={styles.label}>Rent Due Day (1-28)</Text>
      <TextInput
        style={styles.input}
        value={form.rent_due_day}
        onChangeText={(v) => set('rent_due_day', v)}
        placeholder="e.g. 5"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
        maxLength={2}
      />

      {/* Move-in Date */}
      <Text style={styles.label}>Move-in Date</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowMoveInPicker(true)}>
        <Text style={form.move_in_date ? styles.dateText : styles.datePlaceholder}>
          {form.move_in_date ? formatDate(form.move_in_date) : 'Select date'}
        </Text>
      </TouchableOpacity>
      {showMoveInPicker && (
        <DateTimePicker
          value={form.move_in_date ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowMoveInPicker(false);
            if (date) set('move_in_date', date);
          }}
        />
      )}

      {/* Security Deposit */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Security Deposit</Text>
      </View>

      <Text style={styles.label}>Amount (Rs)</Text>
      <TextInput
        style={styles.input}
        value={form.deposit_amount}
        onChangeText={(v) => set('deposit_amount', v)}
        placeholder="e.g. 16000"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Deposit Date</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDepositDatePicker(true)}>
        <Text style={form.deposit_date ? styles.dateText : styles.datePlaceholder}>
          {form.deposit_date ? formatDate(form.deposit_date) : 'Select date'}
        </Text>
      </TouchableOpacity>
      {showDepositDatePicker && (
        <DateTimePicker
          value={form.deposit_date ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDepositDatePicker(false);
            if (date) set('deposit_date', date);
          }}
        />
      )}

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.notes}
        onChangeText={(v) => set('notes', v)}
        placeholder="Any additional notes..."
        placeholderTextColor={COLORS.textMuted}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnLabel}>{saving ? 'Saving...' : 'Save Tenant'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  label: {
    ...FONTS.small,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    ...INPUT_STYLE,
  },
  textArea: {
    height: 80,
  },
  pickerWrapper: {
    ...INPUT_STYLE,
    padding: 0,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  dateBtn: {
    ...INPUT_STYLE,
    justifyContent: 'center',
  },
  dateText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  datePlaceholder: {
    ...FONTS.body,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveBtn: {
    ...BTN.primary,
    marginTop: SPACING.xl,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnLabel: {
    ...FONTS.body,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

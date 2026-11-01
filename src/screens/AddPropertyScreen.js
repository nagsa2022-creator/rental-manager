import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, Switch,
  TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import { getAllOwners, saveProperty, getProperty } from '../database/queries';

const PROPERTY_TYPES = ['flat', 'rooms', 'building'];

export default function AddPropertyScreen({ route, navigation }) {
  const { id, owner_id: prefillOwner } = route.params || {};
  const isEdit = !!id;

  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState({
    name: '', owner_id: prefillOwner || '', type: 'flat',
    address: '', has_floors: false, electricity_rate: '', notes: '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Property' : 'Add Property' });
    init();
  }, []);

  async function init() {
    try {
      const ownerList = await getAllOwners();
      setOwners(ownerList);
      if (isEdit) {
        const prop = await getProperty(id);
        if (prop) {
          setForm({
            name: prop.name || '',
            owner_id: prop.owner_id ? String(prop.owner_id) : '',
            type: prop.type || 'flat',
            address: prop.address || '',
            has_floors: !!prop.has_floors,
            electricity_rate: prop.electricity_rate ? String(prop.electricity_rate) : '',
            notes: prop.notes || '',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Property name is required.');
      return;
    }
    setSaving(true);
    try {
      await saveProperty({
        id: isEdit ? id : undefined,
        name: form.name.trim(),
        owner_id: form.owner_id || null,
        type: form.type,
        address: form.address.trim(),
        has_floors: form.has_floors ? 1 : 0,
        electricity_rate: form.electricity_rate ? parseFloat(form.electricity_rate) : null,
        notes: form.notes.trim(),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save property.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <Text style={styles.label}>Property Name <Text style={styles.req}>*</Text></Text>
      <TextInput
        style={INPUT_STYLE}
        placeholder="e.g. Sunrise Apartments"
        placeholderTextColor={COLORS.placeholder}
        value={form.name}
        onChangeText={v => set('name', v)}
      />

      <Text style={styles.label}>Owner</Text>
      <View style={styles.pickerWrap}>
        {owners.map(o => (
          <TouchableOpacity
            key={o.id}
            style={[styles.option, String(form.owner_id) === String(o.id) && styles.optionActive]}
            onPress={() => set('owner_id', String(o.id))}
          >
            <Text style={[styles.optionText, String(form.owner_id) === String(o.id) && styles.optionTextActive]}>
              {o.name}
            </Text>
          </TouchableOpacity>
        ))}
        {owners.length === 0 && <Text style={styles.noData}>No owners found. Add an owner first.</Text>}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {PROPERTY_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
            onPress={() => set('type', t)}
          >
            <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[INPUT_STYLE, styles.multiline]}
        placeholder="Full address"
        placeholderTextColor={COLORS.placeholder}
        value={form.address}
        onChangeText={v => set('address', v)}
        multiline
        numberOfLines={2}
      />

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Has Floors</Text>
          <Text style={styles.hint}>Enable to configure floors and rooms separately</Text>
        </View>
        <Switch
          value={form.has_floors}
          onValueChange={v => set('has_floors', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      <Text style={styles.label}>Electricity Rate (per unit)</Text>
      <TextInput
        style={INPUT_STYLE}
        placeholder="e.g. 8.50"
        placeholderTextColor={COLORS.placeholder}
        value={form.electricity_rate}
        onChangeText={v => set('electricity_rate', v)}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[INPUT_STYLE, styles.multiline]}
        placeholder="Any additional notes"
        placeholderTextColor={COLORS.placeholder}
        value={form.notes}
        onChangeText={v => set('notes', v)}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[BTN.primary, saving && BTN.disabled, styles.saveBtn]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving
          ? <ActivityIndicator color={COLORS.white} />
          : <Text style={BTN.primaryText}>{isEdit ? 'Save Changes' : 'Add Property'}</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  label: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: SPACING.md, marginBottom: SPACING.xs },
  req: { color: COLORS.danger },
  hint: { color: COLORS.textSubtle, fontSize: FONTS.xs, marginTop: 2 },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  option: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  optionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  optionTextActive: { color: COLORS.white, fontWeight: '600' },
  noData: { color: COLORS.textMuted, fontSize: FONTS.sm, fontStyle: 'italic' },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  typeBtnTextActive: { color: COLORS.white, fontWeight: '600' },
  multiline: { height: undefined, minHeight: 70, textAlignVertical: 'top', paddingTop: SPACING.sm },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: { marginTop: SPACING.xl },
});

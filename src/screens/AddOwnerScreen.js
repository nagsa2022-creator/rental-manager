import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SPACING, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import { getOwner, saveOwner } from '../database/queries';

const FIELDS = [
  { key: 'name',      label: 'Name',         required: true,  multiline: false, keyboard: 'default'    },
  { key: 'phone',     label: 'Phone',        required: false, multiline: false, keyboard: 'phone-pad'  },
  { key: 'upi_id',    label: 'UPI ID',       required: false, multiline: false, keyboard: 'default'    },
  { key: 'bank_info', label: 'Bank Details', required: false, multiline: true,  keyboard: 'default'    },
  { key: 'notes',     label: 'Notes',        required: false, multiline: true,  keyboard: 'default'    },
];

const EMPTY = { name: '', phone: '', upi_id: '', bank_info: '', notes: '' };

export default function AddOwnerScreen({ route, navigation }) {
  const editId = route.params?.id ?? null;
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Owner' : 'Add Owner' });
    if (isEdit) loadOwner();
  }, []);

  const loadOwner = async () => {
    const owner = await getOwner(editId);
    if (owner) {
      setForm({
        name:      owner.name      ?? '',
        phone:     owner.phone     ?? '',
        upi_id:    owner.upi_id    ?? '',
        bank_info: owner.bank_info ?? '',
        notes:     owner.notes     ?? '',
      });
    }
    setLoading(false);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveOwner({ id: editId, ...form });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save owner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {FIELDS.map(({ key, label, required, multiline, keyboard }) => (
          <View key={key} style={styles.fieldGroup}>
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[
                INPUT_STYLE,
                styles.input,
                multiline && styles.inputMulti,
                errors[key] && styles.inputError,
              ]}
              value={form[key]}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, [key]: v }));
                if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
              }}
              placeholder={label}
              placeholderTextColor={COLORS.muted}
              keyboardType={keyboard}
              autoCapitalize={key === 'upi_id' ? 'none' : 'words'}
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
              textAlignVertical={multiline ? 'top' : 'center'}
            />
            {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
          </View>
        ))}

        <TouchableOpacity
          style={[BTN.primary, styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={COLORS.buttonText} />
            : <Text style={styles.saveBtnText}>{isEdit ? 'Update Owner' : 'Save Owner'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: COLORS.background },
  container:      { flex: 1, backgroundColor: COLORS.background },
  content:        { padding: SPACING.md, paddingBottom: SPACING.xl },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  fieldGroup:     { marginBottom: SPACING.md },
  label:          { ...FONTS.small, color: COLORS.muted, marginBottom: 4 },
  required:       { color: COLORS.danger },
  input:          { color: COLORS.text },
  inputMulti:     { minHeight: 80 },
  inputError:     { borderColor: COLORS.danger },
  errorText:      { ...FONTS.small, color: COLORS.danger, marginTop: 3 },
  saveBtn:        { marginTop: SPACING.sm },
  saveBtnDisabled:{ opacity: 0.6 },
  saveBtnText:    { ...FONTS.body, color: COLORS.buttonText, fontWeight: '600', textAlign: 'center' },
});

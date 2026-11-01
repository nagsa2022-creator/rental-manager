import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import { getCategories, addCategory } from '../database/queries';
import { getDatabase } from '../database/database';

export default function SettingsScreen() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  const load = async () => { setCategories(await getCategories()); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAddCategory = async () => {
    if (newCat.trim()) {
      await addCategory(newCat.trim());
      setNewCat('');
      load();
    }
  };

  const handleBackup = async () => {
    try {
      const dbPath = FileSystem.documentDirectory + 'SQLite/rentalmanager_v2.db';
      const backupPath = FileSystem.cacheDirectory + 'rental_backup.db';
      await FileSystem.copyAsync({ from: dbPath, to: backupPath });
      await Sharing.shareAsync(backupPath, { mimeType: 'application/x-sqlite3', dialogTitle: 'Backup Database' });
    } catch (e) {
      Alert.alert('Backup Error', String(e));
    }
  };

  const handleRestore = async () => {
    Alert.alert('Restore', 'This will replace all current data. Continue?', [
      { text: 'Cancel' },
      { text: 'Restore', style: 'destructive', onPress: async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
          if (result.canceled) return;
          const file = result.assets[0];
          const dbPath = FileSystem.documentDirectory + 'SQLite/rentalmanager_v2.db';
          await FileSystem.copyAsync({ from: file.uri, to: dbPath });
          Alert.alert('Restored', 'Database restored. Please restart the app.');
        } catch (e) {
          Alert.alert('Restore Error', String(e));
        }
      }}
    ]);
  };

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: SPACING.xl }}>
      <Text style={{ ...FONTS.caption, marginBottom: SPACING.sm, paddingHorizontal: SPACING.lg }}>{title.toUpperCase()}</Text>
      <View style={{ ...CARD_STYLE, marginHorizontal: SPACING.lg }}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: SPACING.lg }}>
      <Section title="Backup & Restore">
        <TouchableOpacity style={{ ...BTN.primary, marginBottom: SPACING.md }} onPress={handleBackup}>
          <Text style={BTN.text}>Export Backup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ ...BTN.primary, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }}
          onPress={handleRestore}>
          <Text style={{ ...BTN.text, color: COLORS.text }}>Restore from Backup</Text>
        </TouchableOpacity>
      </Section>

      <Section title="Expense Categories">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
          {categories.map(c => (
            <View key={c.id} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginRight: SPACING.xs,
              marginBottom: SPACING.xs, borderRadius: 6, backgroundColor: c.is_custom ? COLORS.primaryDark : COLORS.cardAlt,
              borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ color: COLORS.text, fontSize: 12 }}>{c.name}{c.is_custom ? ' *' : ''}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TextInput style={{ ...INPUT_STYLE, flex: 1, marginRight: SPACING.sm }} placeholder="New category"
            placeholderTextColor={COLORS.textMuted} value={newCat} onChangeText={setNewCat} />
          <TouchableOpacity style={{ ...BTN.primary, justifyContent: 'center' }} onPress={handleAddCategory}>
            <Text style={BTN.text}>Add</Text>
          </TouchableOpacity>
        </View>
      </Section>

      <Section title="About">
        <Text style={FONTS.body}>Rental Manager v2.0</Text>
        <Text style={{ ...FONTS.caption, marginTop: SPACING.xs }}>Multi-owner property management</Text>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

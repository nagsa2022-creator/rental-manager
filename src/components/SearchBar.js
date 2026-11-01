import React from 'react';
import { View, TextInput } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search...' }) {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
      <TextInput
        style={{
          backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
          borderRadius: 8, padding: SPACING.md, color: COLORS.text, fontSize: 14,
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

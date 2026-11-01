import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

const STATUS_MAP = {
  paid: { bg: '#1B3A2D', color: COLORS.success, label: 'Paid' },
  pending: { bg: '#3D2B1A', color: COLORS.warning, label: 'Pending' },
  overdue: { bg: '#3D1A1A', color: COLORS.danger, label: 'Overdue' },
  partial: { bg: '#2D2B1A', color: '#E3B341', label: 'Partial' },
  advance: { bg: '#1A2D3D', color: COLORS.primary, label: 'Advance' },
  active: { bg: '#1B3A2D', color: COLORS.success, label: 'Active' },
  inactive: { bg: '#2A2A2A', color: COLORS.textMuted, label: 'Inactive' },
  held: { bg: '#1A2D3D', color: COLORS.primary, label: 'Held' },
  refunded: { bg: '#1B3A2D', color: COLORS.success, label: 'Refunded' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: 4 }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

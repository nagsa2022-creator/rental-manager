import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, BTN } from '../constants/theme';
import { getOwner, getPropertiesByOwner, deleteOwner } from '../database/queries';

// ── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null;

// ── Property card ─────────────────────────────────────────────────────────────
const PropertyCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.propCard} onPress={onPress} activeOpacity={0.75}>
    <Text style={styles.propName}>{item.name || item.address || 'Unnamed Property'}</Text>
    {item.address && item.name && <Text style={styles.propMeta}>{item.address}</Text>}
    <Text style={styles.propType}>{item.type || ''}</Text>
  </TouchableOpacity>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OwnerDetailScreen({ route, navigation }) {
  const { id, name: initialName } = route.params;

  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [o, props] = await Promise.all([getOwner(id), getPropertiesByOwner(id)]);
        if (!active) return;
        setOwner(o);
        setProperties(props);
        navigation.setOptions({ title: o?.name ?? initialName });
        setLoading(false);
      })();
      return () => { active = false; };
    }, [id])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Owner',
      `Remove "${owner?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteOwner(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Owner not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Owner info card ── */}
      <View style={styles.infoCard}>
        <Text style={styles.ownerName}>{owner.name}</Text>
        <InfoRow label="Phone"    value={owner.phone}     />
        <InfoRow label="UPI ID"   value={owner.upi_id}    />
        <InfoRow label="Bank"     value={owner.bank_info} />
        <InfoRow label="Notes"    value={owner.notes}     />
      </View>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[BTN.primary, styles.actionBtn]}
          onPress={() => navigation.navigate('AddOwner', { id })}
        >
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[BTN.secondary, styles.actionBtn]}
          onPress={() => navigation.navigate('AnnualSummary', { owner_id: id })}
        >
          <Text style={styles.actionBtnTextSecondary}>Annual Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[BTN.danger ?? styles.dangerBtnFallback, styles.actionBtn]}
          onPress={handleDelete}
        >
          <Text style={styles.dangerBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* ── Properties section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Properties ({properties.length})</Text>
        <TouchableOpacity
          style={styles.addPropBtn}
          onPress={() => navigation.navigate('AddProperty', { owner_id: id })}
        >
          <Text style={styles.addPropText}>+ Add Property</Text>
        </TouchableOpacity>
      </View>

      {properties.length === 0 ? (
        <Text style={styles.emptyText}>No properties yet.</Text>
      ) : (
        properties.map((item) => (
          <PropertyCard
            key={String(item.id)}
            item={item}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id, name: item.name })}
          />
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: SPACING.md, paddingBottom: SPACING.xl },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Info card
  infoCard:   { ...CARD_STYLE, marginBottom: SPACING.md },
  ownerName:  { ...FONTS.heading, color: COLORS.text, marginBottom: SPACING.sm },
  infoRow:    { flexDirection: 'row', marginBottom: 6 },
  infoLabel:  { ...FONTS.small, color: COLORS.muted, width: 80 },
  infoValue:  { ...FONTS.small, color: COLORS.text, flex: 1 },

  // Action row
  actions:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn:  { flex: 1, minWidth: 90 },
  actionBtnText:          { ...FONTS.body, color: COLORS.buttonText, fontWeight: '600', textAlign: 'center' },
  actionBtnTextSecondary: { ...FONTS.body, color: COLORS.primary,    fontWeight: '600', textAlign: 'center' },
  dangerBtnFallback: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dangerBtnText: { ...FONTS.body, color: '#fff', fontWeight: '600', textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: { ...FONTS.subheading, color: COLORS.text },
  addPropBtn:   {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addPropText: { ...FONTS.small, color: COLORS.buttonText, fontWeight: '600' },

  // Property cards
  propCard:  { ...CARD_STYLE, marginBottom: SPACING.sm },
  propName:  { ...FONTS.body, color: COLORS.text, fontWeight: '600' },
  propMeta:  { ...FONTS.small, color: COLORS.muted, marginTop: 2 },
  propType:  { ...FONTS.small, color: COLORS.primary, marginTop: 2 },

  emptyText: { ...FONTS.body, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.md },
});

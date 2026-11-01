import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, BTN } from '../constants/theme';
import { getProperty, getTenantsByProperty } from '../database/queries';

export default function PropertyDetailScreen({ route, navigation }) {
  const { id, name } = route.params || {};
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    navigation.setOptions({ title: name || 'Property' });
    load();
  }, [id]));

  async function load() {
    setLoading(true);
    try {
      const [prop, tenantList] = await Promise.all([
        getProperty(id),
        getTenantsByProperty(id),
      ]);
      setProperty(prop);
      setTenants((tenantList || []).filter(t => t.is_active !== 0));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );

  if (!property) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={FONTS.caption}>Property not found.</Text>
    </View>
  );

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <View style={{ flexDirection: 'row', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderColor: COLORS.border }}>
        <Text style={{ ...FONTS.caption, width: 120 }}>{label}</Text>
        <Text style={{ ...FONTS.body, flex: 1 }}>{value}</Text>
      </View>
    );
  };

  const ActionBtn = ({ title, onPress, color }) => (
    <TouchableOpacity style={{ ...BTN.primary, marginBottom: SPACING.sm, ...(color && { backgroundColor: color }) }}
      onPress={onPress} activeOpacity={0.8}>
      <Text style={BTN.text}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>

      <View style={CARD_STYLE}>
        <Text style={{ ...FONTS.title, marginBottom: SPACING.sm }}>{property.name}</Text>
        <InfoRow label="Type" value={property.type} />
        <InfoRow label="Owner" value={property.owner_name} />
        <InfoRow label="Address" value={property.address} />
        <InfoRow label="Elec. Rate" value={property.electricity_rate ? `₹${property.electricity_rate}/unit` : null} />
        {!!property.notes && <Text style={{ ...FONTS.caption, marginTop: SPACING.sm, fontStyle: 'italic' }}>{property.notes}</Text>}
      </View>

      <View style={CARD_STYLE}>
        <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Active Tenants ({tenants.length})</Text>
        {tenants.length === 0 ? (
          <Text style={FONTS.caption}>No active tenants.</Text>
        ) : tenants.map(t => (
          <TouchableOpacity key={t.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs,
              borderBottomWidth: 1, borderColor: COLORS.border }}
            onPress={() => navigation.navigate('TenantDetail', { id: t.id, name: t.name })}>
            <View style={{ flex: 1 }}>
              <Text style={FONTS.body}>{t.name}</Text>
              {!!t.room_name && <Text style={FONTS.small}>{t.room_name}</Text>}
            </View>
            {!!t.phone && <Text style={FONTS.caption}>{t.phone}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <ActionBtn title="Setup Floors / Rooms"
        onPress={() => navigation.navigate('PropertySetup', {
          property_id: id, property_name: property.name, has_floors: !!property.has_floors,
        })} />
      <ActionBtn title="Monthly Billing" color={COLORS.success}
        onPress={() => navigation.navigate('MonthlyBilling', { property_id: id })} />
      <ActionBtn title="Add Tenant"
        onPress={() => navigation.navigate('AddTenant', { property_id: id })} />
      <ActionBtn title="Expenses"
        onPress={() => navigation.navigate('Expenses', { property_id: id })} />
      <ActionBtn title="Edit Property" color={COLORS.card}
        onPress={() => navigation.navigate('AddProperty', { id })} />
    </ScrollView>
  );
}

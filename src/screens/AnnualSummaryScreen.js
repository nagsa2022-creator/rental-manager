import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS } from '../constants/theme';
import { getAnnualSummary, getOwner, getProperty, getAllProperties } from '../database/queries';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function AnnualSummaryScreen({ route, navigation }) {
  const { owner_id, property_id } = route.params || {};

  const [year, setYear] = useState(route.params?.year || new Date().getFullYear());
  const [owner, setOwner] = useState(null);
  const [property, setProperty] = useState(null);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [year]));

  async function load() {
    const [o, p, rows] = await Promise.all([
      getOwner(owner_id),
      getProperty(property_id),
      getAnnualSummary(owner_id, property_id, year),
    ]);
    setOwner(o);
    setProperty(p);
    setData(rows);
  }

  const totals = data.reduce((acc, r) => ({
    rent: acc.rent + (r.total_rent || 0),
    elec: acc.elec + (r.electricity_paid || 0),
    water: acc.water + (r.water_paid || 0),
    other: acc.other + (r.other_expenses || 0),
    net: acc.net + (r.net_payout || 0),
  }), { rent: 0, elec: 0, water: 0, other: 0, net: 0 });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        tintColor={COLORS.primary} />}>
      <View style={{ padding: SPACING.lg }}>

        {/* Header */}
        <View style={CARD_STYLE}>
          <Text style={FONTS.subtitle}>{owner?.name || 'Owner'}</Text>
          <Text style={FONTS.caption}>{property?.name || 'Property'}</Text>
        </View>

        {/* Year Selector */}
        <View style={{ ...CARD_STYLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setYear(y => y - 1)} style={{ padding: SPACING.sm }}>
            <Text style={{ color: COLORS.primary, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={FONTS.subtitle}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(y => y + 1)} style={{ padding: SPACING.sm }}>
            <Text style={{ color: COLORS.primary, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Rows */}
        {data.length === 0 ? (
          <Text style={{ ...FONTS.caption, textAlign: 'center', marginTop: 40 }}>
            No payout records for {year}.
          </Text>
        ) : (
          <>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
              borderBottomWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ ...FONTS.small, flex: 1 }}>Month</Text>
              <Text style={{ ...FONTS.small, flex: 1, textAlign: 'right' }}>Rent</Text>
              <Text style={{ ...FONTS.small, flex: 1, textAlign: 'right' }}>Deduct</Text>
              <Text style={{ ...FONTS.small, flex: 1, textAlign: 'right' }}>Net</Text>
              <Text style={{ ...FONTS.small, width: 36, textAlign: 'center' }}>Paid</Text>
            </View>

            {data.map((r, i) => {
              const deductions = (r.electricity_paid || 0) + (r.water_paid || 0) + (r.other_expenses || 0);
              return (
                <View key={i} style={{ flexDirection: 'row', paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.border,
                  backgroundColor: i % 2 === 0 ? 'transparent' : COLORS.card }}>
                  <Text style={{ ...FONTS.body, flex: 1, fontSize: 13 }}>{MONTHS[(r.month || 1) - 1]}</Text>
                  <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontSize: 13 }}>{fmt(r.total_rent)}</Text>
                  <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontSize: 13, color: COLORS.danger }}>
                    {fmt(deductions)}
                  </Text>
                  <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontSize: 13,
                    color: (r.net_payout || 0) >= 0 ? COLORS.success : COLORS.danger }}>
                    {fmt(r.net_payout)}
                  </Text>
                  <Text style={{ width: 36, textAlign: 'center', fontSize: 13,
                    color: r.is_paid ? COLORS.success : COLORS.textMuted }}>
                    {r.is_paid ? 'Y' : '-'}
                  </Text>
                </View>
              );
            })}

            {/* Totals Row */}
            <View style={{ flexDirection: 'row', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
              backgroundColor: COLORS.cardAlt, borderRadius: 8, marginTop: SPACING.sm }}>
              <Text style={{ ...FONTS.body, flex: 1, fontWeight: '700', fontSize: 13 }}>Total</Text>
              <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontWeight: '700', fontSize: 13 }}>
                {fmt(totals.rent)}
              </Text>
              <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontWeight: '700', fontSize: 13, color: COLORS.danger }}>
                {fmt(totals.elec + totals.water + totals.other)}
              </Text>
              <Text style={{ ...FONTS.body, flex: 1, textAlign: 'right', fontWeight: '700', fontSize: 13,
                color: totals.net >= 0 ? COLORS.success : COLORS.danger }}>
                {fmt(totals.net)}
              </Text>
              <Text style={{ width: 36 }} />
            </View>

            {/* Breakdown Card */}
            <View style={{ ...CARD_STYLE, marginTop: SPACING.md }}>
              <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Annual Breakdown</Text>
              <Row label="Total Rent Collected" value={fmt(totals.rent)} color={COLORS.text} />
              <Row label="Electricity Paid" value={`-${fmt(totals.elec)}`} color={COLORS.danger} />
              <Row label="Water Paid" value={`-${fmt(totals.water)}`} color={COLORS.danger} />
              <Row label="Other Expenses" value={`-${fmt(totals.other)}`} color={COLORS.danger} />
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
              <Row label="Net Payout" value={fmt(totals.net)}
                color={totals.net >= 0 ? COLORS.success : COLORS.danger} bold />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, color = COLORS.text, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs }}>
      <Text style={{ ...FONTS.body, ...(bold && { fontWeight: '700' }) }}>{label}</Text>
      <Text style={{ ...FONTS.body, color, ...(bold && { fontWeight: '700' }) }}>{value}</Text>
    </View>
  );
}

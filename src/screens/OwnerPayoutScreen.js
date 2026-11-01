import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import {
  getOrCreatePayout, updatePayout, getDuesByBill,
  getOwner, getProperty, getExpenses,
} from '../database/queries';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function OwnerPayoutScreen({ route, navigation }) {
  const { monthly_bill_id, owner_id, property_id, month, year } = route.params || {};

  const [owner, setOwner] = useState(null);
  const [property, setProperty] = useState(null);
  const [payout, setPayout] = useState(null);
  const [dues, setDues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Editable overrides
  const [electricityPaid, setElectricityPaid] = useState('');
  const [waterPaid, setWaterPaid] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');
  const [notes, setNotes] = useState('');

  useFocusEffect(useCallback(() => {
    load();
  }, [monthly_bill_id]));

  async function load() {
    const [o, p, d] = await Promise.all([
      getOwner(owner_id),
      getProperty(property_id),
      getDuesByBill(monthly_bill_id),
    ]);
    setOwner(o);
    setProperty(p);
    setDues(d);

    const po = await getOrCreatePayout(monthly_bill_id, owner_id);
    setPayout(po);
    setElectricityPaid(String(po.electricity_paid || ''));
    setWaterPaid(String(po.water_paid || ''));
    setOtherExpenses(String(po.other_expenses || ''));
    setNotes(po.notes || '');
  }

  const totalRent = dues.reduce((s, d) => s + (d.amount_received || 0), 0);
  const elecPaid = parseFloat(electricityPaid) || 0;
  const waterPd = parseFloat(waterPaid) || 0;
  const otherExp = parseFloat(otherExpenses) || 0;
  const netPayout = totalRent - elecPaid - waterPd - otherExp;

  async function savePayout() {
    if (!payout) return;
    await updatePayout(payout.id, {
      total_rent: totalRent,
      electricity_paid: elecPaid,
      water_paid: waterPd,
      other_expenses: otherExp,
      net_payout: netPayout,
      notes,
    });
    Alert.alert('Saved', 'Payout details saved.');
    await load();
  }

  async function markPaid() {
    if (!payout) return;
    await savePayout();
    await updatePayout(payout.id, {
      is_paid: 1,
      payment_date: new Date().toISOString().split('T')[0],
    });
    Alert.alert('Done', 'Payout marked as paid.');
    await load();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        tintColor={COLORS.primary} />}>
      <View style={{ padding: SPACING.lg }}>

        {/* Header */}
        <View style={CARD_STYLE}>
          <Text style={FONTS.subtitle}>{owner?.name || 'Owner'}</Text>
          <Text style={FONTS.caption}>{property?.name || 'Property'} - {MONTHS[(month || 1) - 1]} {year}</Text>
          {payout?.is_paid ? (
            <View style={{ marginTop: SPACING.sm, backgroundColor: COLORS.success,
              paddingVertical: 4, paddingHorizontal: SPACING.sm, borderRadius: 4, alignSelf: 'flex-start' }}>
              <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                PAID {payout.payment_date ? `on ${payout.payment_date}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Rent Collection */}
        <View style={CARD_STYLE}>
          <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Rent Collection</Text>
          {dues.map(d => (
            <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between',
              paddingVertical: SPACING.xs, borderBottomWidth: 1, borderColor: COLORS.border }}>
              <Text style={FONTS.body}>{d.tenant_name}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: d.amount_received > 0 ? COLORS.success : COLORS.textMuted, fontSize: 14 }}>
                  {fmt(d.amount_received)}
                </Text>
                {d.balance > 0 && <Text style={FONTS.small}>Pending: {fmt(d.balance)}</Text>}
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm }}>
            <Text style={{ ...FONTS.body, fontWeight: '600' }}>Total Collected</Text>
            <Text style={{ ...FONTS.body, fontWeight: '600', color: COLORS.success }}>{fmt(totalRent)}</Text>
          </View>
        </View>

        {/* Deductions */}
        <View style={CARD_STYLE}>
          <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Deductions</Text>

          <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Electricity Bill Paid</Text>
          <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.sm }}
            value={electricityPaid} onChangeText={setElectricityPaid}
            keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted} />

          <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Water Bill Paid</Text>
          <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.sm }}
            value={waterPaid} onChangeText={setWaterPaid}
            keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted} />

          <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Other Expenses</Text>
          <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.sm }}
            value={otherExpenses} onChangeText={setOtherExpenses}
            keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted} />

          <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Notes</Text>
          <TextInput style={{ ...INPUT_STYLE, minHeight: 60 }}
            value={notes} onChangeText={setNotes}
            multiline placeholder="Optional notes" placeholderTextColor={COLORS.textMuted} />
        </View>

        {/* Net Payout */}
        <View style={{ ...CARD_STYLE, alignItems: 'center' }}>
          <Text style={FONTS.caption}>Net Payout to Owner</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: netPayout >= 0 ? COLORS.success : COLORS.danger,
            marginVertical: SPACING.sm }}>
            {fmt(netPayout)}
          </Text>
          <Text style={FONTS.small}>
            {fmt(totalRent)} - {fmt(elecPaid)} - {fmt(waterPd)} - {fmt(otherExp)}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xxl }}>
          <TouchableOpacity style={{ ...BTN.primary, flex: 1 }} onPress={savePayout}>
            <Text style={BTN.text}>Save</Text>
          </TouchableOpacity>
          {!payout?.is_paid && (
            <TouchableOpacity style={{ ...BTN.primary, flex: 1, backgroundColor: COLORS.success }}
              onPress={markPaid}>
              <Text style={BTN.text}>Mark Paid</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Annual Summary Link */}
        <TouchableOpacity style={{ ...CARD_STYLE, alignItems: 'center' }}
          onPress={() => navigation.navigate('AnnualSummary', {
            owner_id, property_id, year,
          })}>
          <Text style={{ color: COLORS.primary, fontSize: 14 }}>View Annual Summary</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

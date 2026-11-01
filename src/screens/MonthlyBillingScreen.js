import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import {
  getAllProperties, getOrCreateMonthlyBill, updateMonthlyBill,
  getSubmeterReadings, updateSubmeterReading, getDuesByBill,
  calculateElectricitySplits, getFloorsByProperty, getProperty,
} from '../database/queries';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function MonthlyBillingScreen({ route, navigation }) {
  const preselectedPropId = route.params?.property_id;

  const [properties, setProperties] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState(preselectedPropId || null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [bill, setBill] = useState(null);
  const [subReadings, setSubReadings] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Editable fields
  const [mainClosing, setMainClosing] = useState('');
  const [mainBill, setMainBill] = useState('');
  const [waterTotal, setWaterTotal] = useState('');
  const [subValues, setSubValues] = useState({});

  useFocusEffect(useCallback(() => {
    loadProperties();
  }, []));

  useEffect(() => {
    if (selectedPropId) loadBill();
  }, [selectedPropId, month, year]);

  async function loadProperties() {
    const props = await getAllProperties();
    setProperties(props);
    if (!selectedPropId && props.length > 0) setSelectedPropId(props[0].id);
  }

  async function loadBill() {
    setLoading(true);
    try {
      const b = await getOrCreateMonthlyBill(selectedPropId, month, year);
      setBill(b);
      setMainClosing(String(b.main_meter_closing || ''));
      setMainBill(String(b.main_meter_bill || ''));
      setWaterTotal(String(b.water_total || ''));

      const subs = await getSubmeterReadings(b.id);
      setSubReadings(subs);
      const sv = {};
      subs.forEach(s => {
        sv[s.id] = { opening: String(s.opening_reading || ''), closing: String(s.closing_reading || '') };
      });
      setSubValues(sv);

      const d = await getDuesByBill(b.id);
      setDues(d);
    } finally {
      setLoading(false);
    }
  }

  async function saveBill() {
    if (!bill) return;
    await updateMonthlyBill(bill.id, {
      main_meter_closing: parseFloat(mainClosing) || 0,
      main_meter_bill: parseFloat(mainBill) || 0,
      water_total: parseFloat(waterTotal) || 0,
    });
    // Save submeter readings
    for (const sr of subReadings) {
      const v = subValues[sr.id];
      if (v) {
        await updateSubmeterReading(sr.id, parseFloat(v.opening) || 0, parseFloat(v.closing) || 0);
      }
    }
    Alert.alert('Saved', 'Bill data saved.');
    await loadBill();
  }

  async function handleCalculate() {
    if (!bill) return;
    await saveBill();
    await calculateElectricitySplits(bill.id);
    Alert.alert('Done', 'Electricity split calculated for all tenants.');
    await loadBill();
  }

  function changeMonth(dir) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  const mainUnits = Math.max(0, (parseFloat(mainClosing) || 0) - (bill?.main_meter_opening || 0));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await loadBill(); setRefreshing(false); }}
        tintColor={COLORS.primary} />}>
      <View style={{ padding: SPACING.lg }}>

        {/* Property Picker */}
        {!preselectedPropId && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: SPACING.md }}>
            {properties.map(p => (
              <TouchableOpacity key={p.id}
                style={{
                  paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                  borderRadius: 20, marginRight: SPACING.sm,
                  backgroundColor: p.id === selectedPropId ? COLORS.primaryDark : COLORS.card,
                  borderWidth: 1, borderColor: p.id === selectedPropId ? COLORS.primary : COLORS.border,
                }}
                onPress={() => setSelectedPropId(p.id)}>
                <Text style={{ color: p.id === selectedPropId ? COLORS.white : COLORS.text, fontSize: 13 }}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Month Selector */}
        <View style={{ ...CARD_STYLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => changeMonth(-1)}
            style={{ padding: SPACING.sm }}>
            <Text style={{ color: COLORS.primary, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={FONTS.subtitle}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}
            style={{ padding: SPACING.sm }}>
            <Text style={{ color: COLORS.primary, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : bill ? (
          <>
            {/* Main Meter */}
            <View style={{ ...CARD_STYLE }}>
              <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Main Meter</Text>
              <View style={{ flexDirection: 'row', marginBottom: SPACING.sm }}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Text style={FONTS.caption}>Opening</Text>
                  <Text style={{ ...FONTS.body, marginTop: 4 }}>{bill.main_meter_opening}</Text>
                </View>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Text style={FONTS.caption}>Closing</Text>
                  <TextInput style={{ ...INPUT_STYLE, marginTop: 4 }}
                    value={mainClosing} onChangeText={setMainClosing}
                    keyboardType="decimal-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={FONTS.caption}>Units</Text>
                  <Text style={{ ...FONTS.body, marginTop: 8, color: COLORS.primary }}>{mainUnits}</Text>
                </View>
              </View>

              <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Electricity Bill Amount</Text>
              <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.sm }}
                value={mainBill} onChangeText={setMainBill}
                keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted} />

              <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Water Bill (Owner Paid)</Text>
              <TextInput style={INPUT_STYLE}
                value={waterTotal} onChangeText={setWaterTotal}
                keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted} />
            </View>

            {/* Submeter Readings */}
            {subReadings.length > 0 && (
              <View style={{ ...CARD_STYLE }}>
                <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.sm }}>Sub-Meter Readings</Text>
                {subReadings.map(sr => (
                  <View key={sr.id} style={{ marginBottom: SPACING.md, paddingBottom: SPACING.sm,
                    borderBottomWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ ...FONTS.body, marginBottom: SPACING.xs }}>{sr.floor_name}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1, marginRight: SPACING.sm }}>
                        <Text style={FONTS.small}>Opening</Text>
                        <TextInput style={{ ...INPUT_STYLE, marginTop: 2, fontSize: 13 }}
                          value={subValues[sr.id]?.opening || ''}
                          onChangeText={v => setSubValues(p => ({ ...p, [sr.id]: { ...p[sr.id], opening: v } }))}
                          keyboardType="decimal-pad" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={FONTS.small}>Closing</Text>
                        <TextInput style={{ ...INPUT_STYLE, marginTop: 2, fontSize: 13 }}
                          value={subValues[sr.id]?.closing || ''}
                          onChangeText={v => setSubValues(p => ({ ...p, [sr.id]: { ...p[sr.id], closing: v } }))}
                          keyboardType="decimal-pad" />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Save + Calculate */}
            <View style={{ flexDirection: 'row', marginBottom: SPACING.lg }}>
              <TouchableOpacity style={{ ...BTN.primary, flex: 1, marginRight: SPACING.sm }}
                onPress={saveBill}>
                <Text style={BTN.text}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ ...BTN.primary, flex: 1, backgroundColor: COLORS.success }}
                onPress={handleCalculate}>
                <Text style={BTN.text}>Calculate Split</Text>
              </TouchableOpacity>
            </View>

            {/* Tenant Dues Preview */}
            {dues.length > 0 && (
              <View style={{ ...CARD_STYLE }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                  <Text style={FONTS.subtitle}>Tenant Dues</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('DuesSummary', {
                    monthly_bill_id: bill.id, property_id: selectedPropId,
                    month, year,
                  })}>
                    <Text style={{ color: COLORS.primary, fontSize: 13 }}>View All</Text>
                  </TouchableOpacity>
                </View>
                {dues.map(d => (
                  <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between',
                    paddingVertical: SPACING.xs, borderBottomWidth: 1, borderColor: COLORS.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={FONTS.body}>{d.tenant_name}</Text>
                      <Text style={FONTS.small}>
                        Rent: {fmt(d.rent)} + Elec: {fmt(d.electricity_share)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ ...FONTS.body, color: d.balance > 0 ? COLORS.warning : COLORS.success }}>
                        {fmt(d.total_due)}
                      </Text>
                      <Text style={FONTS.small}>
                        {d.status === 'paid' ? 'Paid' : d.amount_received > 0 ? `Rcvd ${fmt(d.amount_received)}` : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Owner Payout Link */}
            <TouchableOpacity style={{ ...CARD_STYLE, alignItems: 'center', marginTop: SPACING.sm }}
              onPress={async () => {
                const prop = await getProperty(selectedPropId);
                navigation.navigate('OwnerPayout', {
                  monthly_bill_id: bill.id, owner_id: prop?.owner_id,
                  property_id: selectedPropId, month, year,
                });
              }}>
              <Text style={{ color: COLORS.primary, fontSize: 14 }}>View Owner Payout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ ...FONTS.caption, textAlign: 'center', marginTop: 40 }}>
            Select a property to begin.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

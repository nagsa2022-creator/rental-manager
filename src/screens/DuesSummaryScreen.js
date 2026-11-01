import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, Linking, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import { getDuesByBill, updateTenantDue, getTenant } from '../database/queries';
import StatusBadge from '../components/StatusBadge';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function DuesSummaryScreen({ route, navigation }) {
  const { monthly_bill_id, month, year } = route.params || {};

  const [dues, setDues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Payment modal
  const [payModal, setPayModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);

  useFocusEffect(useCallback(() => {
    navigation.setOptions({ title: `Dues - ${MONTHS[(month || 1) - 1]} ${year || ''}` });
    loadDues();
  }, [monthly_bill_id]));

  async function loadDues() {
    const d = await getDuesByBill(monthly_bill_id);
    setDues(d);
  }

  function openPayment(due) {
    setSelectedDue(due);
    setPayAmount(String(due.balance || due.total_due || ''));
    setIsAdvance(false);
    setPayModal(true);
  }

  async function recordPayment() {
    if (!selectedDue) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    const totalReceived = (selectedDue.amount_received || 0) + amt;
    const balance = (selectedDue.total_due || 0) - totalReceived;
    let status = 'pending';
    if (balance <= 0) status = isAdvance ? 'advance' : 'paid';
    else if (totalReceived > 0) status = 'partial';

    await updateTenantDue(selectedDue.id, {
      amount_received: totalReceived,
      balance: Math.max(0, balance),
      payment_date: new Date().toISOString().split('T')[0],
      is_advance: isAdvance ? 1 : 0,
      status,
    });
    setPayModal(false);
    await loadDues();
  }

  async function sendWhatsApp(due) {
    const tenant = await getTenant(due.tenant_id);
    if (!tenant?.phone) { Alert.alert('No Phone', 'Tenant has no phone number.'); return; }
    const phone = tenant.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
    const msg = `Hi ${due.tenant_name},\n\n`
      + `Rent for ${MONTHS[(month || 1) - 1]} ${year}:\n`
      + `  Rent: ${fmt(due.rent)}\n`
      + (due.electricity_share ? `  Electricity: ${fmt(due.electricity_share)}\n` : '')
      + `  Total: ${fmt(due.total_due)}\n`
      + (due.amount_received > 0 ? `  Received: ${fmt(due.amount_received)}\n` : '')
      + (due.balance > 0 ? `  Balance: ${fmt(due.balance)}\n` : '')
      + `\nPlease pay at your earliest convenience.`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  }

  async function sendGPay(due) {
    const tenant = await getTenant(due.tenant_id);
    const upiId = tenant?.owner_upi;
    if (!upiId) { Alert.alert('No UPI', 'Owner has no UPI ID set.'); return; }
    const amount = due.balance > 0 ? due.balance : due.total_due;
    const note = `Rent ${MONTHS[(month || 1) - 1]} ${year}`;
    const url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Landlord&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    Linking.openURL(url);
  }

  const totalDue = dues.reduce((s, d) => s + (d.total_due || 0), 0);
  const totalReceived = dues.reduce((s, d) => s + (d.amount_received || 0), 0);
  const totalPending = totalDue - totalReceived;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await loadDues(); setRefreshing(false); }}
          tintColor={COLORS.primary} />
      }>
        <View style={{ padding: SPACING.lg }}>

          {/* Summary */}
          <View style={{ ...CARD_STYLE, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={FONTS.caption}>Total Due</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.warning }}>{fmt(totalDue)}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={FONTS.caption}>Received</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.success }}>{fmt(totalReceived)}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={FONTS.caption}>Pending</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.danger }}>{fmt(totalPending)}</Text>
            </View>
          </View>

          {/* Tenant Cards */}
          {dues.length === 0 ? (
            <Text style={{ ...FONTS.caption, textAlign: 'center', marginTop: 40 }}>
              No tenant dues for this month.
            </Text>
          ) : dues.map(d => (
            <View key={d.id} style={{ ...CARD_STYLE }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                <View style={{ flex: 1 }}>
                  <Text style={FONTS.subtitle}>{d.tenant_name}</Text>
                  {d.room_name && <Text style={FONTS.small}>{d.room_name}</Text>}
                </View>
                <StatusBadge status={d.status || 'pending'} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                <Text style={FONTS.caption}>Rent: {fmt(d.rent)}</Text>
                <Text style={FONTS.caption}>Elec: {fmt(d.electricity_share)}</Text>
                <Text style={{ ...FONTS.body, fontWeight: '600' }}>Total: {fmt(d.total_due)}</Text>
              </View>

              {d.amount_received > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                  <Text style={{ ...FONTS.caption, color: COLORS.success }}>Received: {fmt(d.amount_received)}</Text>
                  {d.balance > 0 && (
                    <Text style={{ ...FONTS.caption, color: COLORS.danger }}>Balance: {fmt(d.balance)}</Text>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', marginTop: SPACING.sm, gap: SPACING.sm }}>
                {d.status !== 'paid' && (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.sm,
                      borderRadius: 6, alignItems: 'center' }}
                    onPress={() => openPayment(d)}>
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>Record Payment</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#25D366', paddingVertical: SPACING.sm,
                    borderRadius: 6, alignItems: 'center' }}
                  onPress={() => sendWhatsApp(d)}>
                  <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#4285F4', paddingVertical: SPACING.sm,
                    borderRadius: 6, alignItems: 'center' }}
                  onPress={() => sendGPay(d)}>
                  <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>GPay</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={payModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.xl }}>
          <View style={{ ...CARD_STYLE, backgroundColor: COLORS.cardAlt }}>
            <Text style={{ ...FONTS.subtitle, marginBottom: SPACING.md }}>
              Record Payment - {selectedDue?.tenant_name}
            </Text>
            <Text style={{ ...FONTS.caption, marginBottom: 4 }}>Amount</Text>
            <TextInput style={{ ...INPUT_STYLE, marginBottom: SPACING.md }}
              value={payAmount} onChangeText={setPayAmount}
              keyboardType="decimal-pad" placeholder="₹ 0" placeholderTextColor={COLORS.textMuted}
              autoFocus />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg }}
              onPress={() => setIsAdvance(!isAdvance)}>
              <View style={{
                width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                borderColor: isAdvance ? COLORS.primary : COLORS.border,
                backgroundColor: isAdvance ? COLORS.primaryDark : 'transparent',
                marginRight: SPACING.sm, alignItems: 'center', justifyContent: 'center',
              }}>
                {isAdvance && <Text style={{ color: COLORS.white, fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={FONTS.body}>Mark as Advance Payment</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: SPACING.md,
                borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }}
                onPress={() => setPayModal(false)}>
                <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ ...BTN.primary, flex: 1 }}
                onPress={recordPayment}>
                <Text style={BTN.text}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

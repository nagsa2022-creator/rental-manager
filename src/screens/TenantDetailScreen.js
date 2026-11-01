import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, BTN } from '../constants/theme';
import { getTenant, getDeposit, getTenantLedger, saveDeposit } from '../database/queries';
import StatusBadge from '../components/StatusBadge';



export default function TenantDetailScreen({ route, navigation }) {
  const { id, name } = route.params;

  const [tenant, setTenant] = useState(null);
  const [deposit, setDeposit] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: name ?? 'Tenant Details' });
      loadAll();
    }, [id])
  );

  const loadAll = async () => {
    setLoading(true);
    const [t, d, l] = await Promise.all([
      getTenant(id),
      getDeposit(id),
      getTenantLedger(id),
    ]);
    setTenant(t);
    setDeposit(d);
    setLedger(l ?? []);
    setLoading(false);
  };

  // WhatsApp reminder for the most recent unpaid month
  const handleWhatsApp = () => {
    if (!tenant?.phone) {
      Alert.alert('No phone number', 'This tenant has no phone number saved.');
      return;
    }
    const pending = ledger.find((m) => m.balance > 0);
    const amount = pending ? pending.balance : tenant.monthly_rent;
    const month = pending ? pending.month_label : 'this month';
    const msg = `Hi ${tenant.name}, this is a reminder that Rs ${amount} is due for rent (${month}). Please arrange payment at your earliest convenience. Thank you.`;
    const phone = tenant.phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`).catch(() =>
      Alert.alert('WhatsApp not available', 'Please ensure WhatsApp is installed.')
    );
  };

  // GPay UPI payment request for the most recent unpaid balance
  const handleGPay = () => {
    if (!tenant?.phone) {
      Alert.alert('No phone number', 'This tenant has no phone number saved.');
      return;
    }
    const pending = ledger.find((m) => m.balance > 0);
    const amount = pending ? pending.balance : tenant.monthly_rent;
    const note = `Rent - ${pending?.month_label ?? 'this month'}`;
    const upiId = tenant.owner_upi;
    if (!upiId) { Alert.alert('No UPI', 'Owner has no UPI ID set.'); return; }
    const url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(tenant.name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    Linking.openURL(url).catch(() =>
      Alert.alert('UPI not available', 'No UPI app found on this device.')
    );
  };

  // Security deposit refund — prompt for partial or full amount
  const handleDepositRefund = () => {
    if (!deposit || deposit.amount <= 0) return;
    Alert.prompt(
      'Refund Deposit',
      `Deposit held: Rs ${deposit.amount}. Enter refund amount:`,
      async (input) => {
        const refund = parseFloat(input);
        if (isNaN(refund) || refund <= 0 || refund > deposit.amount) {
          Alert.alert('Invalid amount', `Enter a value between 1 and ${deposit.amount}.`);
          return;
        }
        const newAmount = deposit.amount - refund;
        await saveDeposit({ tenant_id: id, amount: newAmount, date: deposit.date, id: deposit.id });
        loadAll();
      },
      'plain-text',
      String(deposit.amount)
    );
  };

  const renderLedgerItem = ({ item }) => (
    <View style={styles.ledgerRow}>
      <View style={styles.ledgerLeft}>
        <Text style={styles.ledgerMonth}>{item.month_label}</Text>
        <Text style={styles.ledgerMeta}>
          Rent: Rs {item.rent ?? 0}  |  Elec: Rs {item.electricity ?? 0}
        </Text>
        <Text style={styles.ledgerMeta}>
          Total: Rs {item.total_due ?? 0}  |  Rcvd: Rs {item.received ?? 0}
        </Text>
      </View>
      <View style={styles.ledgerRight}>
        <Text style={[styles.ledgerBalance, item.balance > 0 ? styles.balanceDue : styles.balanceClear]}>
          {item.balance > 0 ? `Rs ${item.balance}` : 'Paid'}
        </Text>
        <StatusBadge status={item.status} compact />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!tenant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Tenant not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Tenant Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.tenantName}>{tenant.name}</Text>
            <StatusBadge status={tenant.status} />
          </View>
          <InfoRow label="Phone" value={tenant.phone || '—'} />
          <InfoRow label="Property" value={tenant.property_name || '—'} />
          <InfoRow label="Room" value={tenant.room_label || '—'} />
          <InfoRow label="Monthly Rent" value={`Rs ${tenant.monthly_rent?.toLocaleString('en-IN') ?? '—'}`} />
          <InfoRow label="Due Day" value={tenant.rent_due_day ? `${tenant.rent_due_day}th of each month` : '—'} />
          <InfoRow label="Move-in Date" value={tenant.move_in_date || '—'} />
          {tenant.notes ? <InfoRow label="Notes" value={tenant.notes} /> : null}
        </View>

        {/* Security Deposit Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security Deposit</Text>
          {deposit ? (
            <>
              <InfoRow label="Amount Held" value={`Rs ${deposit.amount?.toLocaleString('en-IN') ?? '0'}`} />
              <InfoRow label="Paid On" value={deposit.date || '—'} />
              <TouchableOpacity
                style={styles.refundBtn}
                onPress={handleDepositRefund}
                activeOpacity={0.8}
              >
                <Text style={styles.refundBtnLabel}>Refund Deposit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>No deposit recorded.</Text>
          )}
        </View>

        {/* Payment Ledger */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Ledger</Text>
          {ledger.length === 0 ? (
            <Text style={styles.emptyText}>No ledger entries yet.</Text>
          ) : (
            <FlatList
              data={ledger}
              keyExtractor={(item) => String(item.id ?? item.month_label)}
              renderItem={renderLedgerItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.whatsappBtn]} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Text style={styles.actionBtnLabel}>Send Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.gpayBtn]} onPress={handleGPay} activeOpacity={0.8}>
            <Text style={styles.actionBtnLabel}>Request GPay</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddTenant', { id: tenant.id })}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnLabel}>Edit Tenant</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  card: {
    ...CARD_STYLE,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tenantName: {
    ...FONTS.heading,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    ...FONTS.small,
    color: COLORS.textMuted,
    flex: 1,
  },
  infoValue: {
    ...FONTS.small,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  refundBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.warning,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  refundBtnLabel: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: '600',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  ledgerLeft: {
    flex: 1,
  },
  ledgerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ledgerMonth: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  ledgerMeta: {
    ...FONTS.small,
    color: COLORS.textMuted,
  },
  ledgerBalance: {
    ...FONTS.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceDue: {
    color: COLORS.danger,
  },
  balanceClear: {
    color: COLORS.success,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  gpayBtn: {
    backgroundColor: '#4A90D9',
  },
  actionBtnLabel: {
    ...FONTS.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  editBtn: {
    ...BTN.secondary,
    alignItems: 'center',
  },
  editBtnLabel: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});

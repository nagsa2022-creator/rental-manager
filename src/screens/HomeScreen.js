import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS } from '../constants/theme';
import { getDashboardStats } from '../database/queries';

const fmt = n => '₹' + (n || 0).toLocaleString('en-IN');

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { setStats(await getDashboardStats()); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const MenuItem = ({ title, subtitle, onPress, color = COLORS.primary }) => (
    <TouchableOpacity style={{ ...CARD_STYLE, flexDirection: 'row', alignItems: 'center' }} onPress={onPress}>
      <View style={{ width: 4, height: 36, backgroundColor: color, borderRadius: 2, marginRight: SPACING.md }} />
      <View style={{ flex: 1 }}>
        <Text style={FONTS.subtitle}>{title}</Text>
        {subtitle && <Text style={FONTS.caption}>{subtitle}</Text>}
      </View>
      <Text style={{ color: COLORS.textMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}>
      <View style={{ padding: SPACING.lg }}>
        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', marginBottom: SPACING.lg }}>
          <View style={{ ...CARD_STYLE, flex: 1, marginRight: SPACING.sm, alignItems: 'center' }}>
            <Text style={FONTS.caption}>Owners</Text>
            <Text style={{ ...FONTS.title, fontSize: 24, color: COLORS.primary }}>{stats.owners || 0}</Text>
          </View>
          <View style={{ ...CARD_STYLE, flex: 1, marginHorizontal: SPACING.xs, alignItems: 'center' }}>
            <Text style={FONTS.caption}>Properties</Text>
            <Text style={{ ...FONTS.title, fontSize: 24, color: COLORS.primary }}>{stats.properties || 0}</Text>
          </View>
          <View style={{ ...CARD_STYLE, flex: 1, marginLeft: SPACING.sm, alignItems: 'center' }}>
            <Text style={FONTS.caption}>Tenants</Text>
            <Text style={{ ...FONTS.title, fontSize: 24, color: COLORS.primary }}>{stats.tenants || 0}</Text>
          </View>
        </View>

        {/* Monthly Overview */}
        <View style={{ ...CARD_STYLE, marginBottom: SPACING.lg }}>
          <Text style={{ ...FONTS.caption, marginBottom: SPACING.sm }}>This Month</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={FONTS.caption}>Due</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.warning }}>{fmt(stats.monthlyDue)}</Text>
            </View>
            <View>
              <Text style={FONTS.caption}>Received</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.success }}>{fmt(stats.monthlyReceived)}</Text>
            </View>
            <View>
              <Text style={FONTS.caption}>Pending</Text>
              <Text style={{ ...FONTS.subtitle, color: COLORS.danger }}>{fmt(stats.monthlyPending)}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <MenuItem title="Owners" subtitle={`${stats.owners || 0} registered`} onPress={() => navigation.navigate('Owners')} />
        <MenuItem title="Properties" subtitle={`${stats.properties || 0} managed`} onPress={() => navigation.navigate('Properties')} color={COLORS.success} />
        <MenuItem title="Tenants" subtitle={`${stats.tenants || 0} active`} onPress={() => navigation.navigate('Tenants')} color={COLORS.warning} />
        <MenuItem title="Expenses" subtitle="Maintenance & repairs" onPress={() => navigation.navigate('Expenses')} color={COLORS.danger} />
        <MenuItem title="Settings" subtitle="Backup, categories" onPress={() => navigation.navigate('Settings')} color={COLORS.textMuted} />
      </View>
    </ScrollView>
  );
}

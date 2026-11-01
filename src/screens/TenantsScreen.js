import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, BTN } from '../constants/theme';
import { getAllTenants } from '../database/queries';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';

export default function TenantsScreen({ navigation }) {
  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTenants = async () => {
    setLoading(true);
    const data = await getAllTenants();
    setTenants(data);
    applyFilter(data, query);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTenants();
    }, [])
  );

  const applyFilter = (data, q) => {
    if (!q.trim()) {
      setFiltered(data);
      return;
    }
    const lower = q.toLowerCase();
    setFiltered(
      data.filter(
        (t) =>
          t.name?.toLowerCase().includes(lower) ||
          t.property_name?.toLowerCase().includes(lower) ||
          t.room_label?.toLowerCase().includes(lower)
      )
    );
  };

  const handleSearch = (q) => {
    setQuery(q);
    applyFilter(tenants, q);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TenantDetail', { id: item.id, name: item.name })}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.meta}>{item.property_name}  •  {item.room_label}</Text>
      <Text style={styles.rent}>Rs {item.monthly_rent?.toLocaleString('en-IN')} / month</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchBar value={query} onChangeText={handleSearch} placeholder="Search tenants..." />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No tenants found.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTenant')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabLabel}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 4,
  },
  card: {
    ...CARD_STYLE,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  meta: {
    ...FONTS.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  rent: {
    ...FONTS.small,
    color: COLORS.primary,
    marginTop: 4,
  },
  empty: {
    ...FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  fab: {
    ...BTN.fab,
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
  },
  fabLabel: {
    ...FONTS.heading,
    color: COLORS.white,
    lineHeight: 32,
  },
});

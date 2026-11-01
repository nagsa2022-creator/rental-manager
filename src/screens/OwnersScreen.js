import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, BTN } from '../constants/theme';
import { getAllOwners, getPropertiesByOwner } from '../database/queries';
import SearchBar from '../components/SearchBar';

export default function OwnersScreen({ navigation }) {
  const [owners, setOwners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOwners = async () => {
    setLoading(true);
    const rows = await getAllOwners();
    const enriched = await Promise.all(
      rows.map(async (o) => {
        const props = await getPropertiesByOwner(o.id);
        return { ...o, propertyCount: props.length };
      })
    );
    setOwners(enriched);
    applyFilter(enriched, query);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadOwners(); }, []));

  const applyFilter = (list, q) => {
    const lower = q.toLowerCase();
    setFiltered(
      q ? list.filter((o) => o.name?.toLowerCase().includes(lower) || o.phone?.includes(q)) : list
    );
  };

  const handleSearch = (q) => {
    setQuery(q);
    applyFilter(owners, q);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OwnerDetail', { id: item.id, name: item.name })}
      activeOpacity={0.75}
    >
      <View style={styles.cardMain}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.phone || 'No phone'}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.propertyCount}</Text>
        <Text style={styles.badgeLabel}>Properties</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchBar value={query} onChangeText={handleSearch} placeholder="Search by name or phone" />
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No owners found.</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddOwner')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: 80 },
  card: {
    ...CARD_STYLE,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardMain: { flex: 1 },
  name: { ...FONTS.body, color: COLORS.text, fontWeight: '600' },
  meta: { ...FONTS.small, color: COLORS.muted, marginTop: 2 },
  badge: { alignItems: 'center', marginLeft: SPACING.sm },
  badgeText: { ...FONTS.body, color: COLORS.primary, fontWeight: '700' },
  badgeLabel: { ...FONTS.small, color: COLORS.muted },
  empty: { ...FONTS.body, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.xl },
  loader: { flex: 1 },
  fab: {
    ...BTN.primary,
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: COLORS.buttonText, lineHeight: 32 },
});

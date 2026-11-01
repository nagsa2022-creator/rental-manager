import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE } from '../constants/theme';
import { getAllProperties } from '../database/queries';

export default function PropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    try {
      const data = await getAllProperties();
      setProperties(data);
      const unique = [...new Map(data.map(p => [p.owner_id, { id: p.owner_id, name: p.owner_name }])).values()];
      setOwners(unique);
      apply(data, search, ownerFilter);
    } finally {
      setLoading(false);
    }
  }

  function apply(list, s, o) {
    let out = list;
    if (s.trim()) {
      const q = s.toLowerCase();
      out = out.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.owner_name?.toLowerCase().includes(q)
      );
    }
    if (o) out = out.filter(p => String(p.owner_id) === String(o));
    setFiltered(out);
  }

  function onSearch(val) {
    setSearch(val);
    apply(properties, val, ownerFilter);
  }

  function onOwnerFilter(id) {
    const next = ownerFilter === id ? '' : id;
    setOwnerFilter(next);
    apply(properties, search, next);
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={[CARD_STYLE, styles.card]}
        onPress={() => navigation.navigate('PropertyDetail', { id: item.id, name: item.name })}
        activeOpacity={0.75}
      >
        <View style={styles.cardRow}>
          <Text style={styles.propName}>{item.name}</Text>
          <Text style={styles.badge}>{item.type}</Text>
        </View>
        <Text style={styles.sub}>Owner: {item.owner_name || '—'}</Text>
        {!!item.address && <Text style={styles.addr}>{item.address}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <TextInput
        style={[INPUT_STYLE, styles.search]}
        placeholder="Search properties..."
        placeholderTextColor={COLORS.placeholder}
        value={search}
        onChangeText={onSearch}
      />

      {owners.length > 0 && (
        <FlatList
          data={owners}
          horizontal
          keyExtractor={o => String(o.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOwnerFilter(String(item.id))}
              style={[styles.chip, ownerFilter === String(item.id) && styles.chipActive]}
            >
              <Text style={[styles.chipText, ownerFilter === String(item.id) && styles.chipTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No properties found.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProperty', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  search: { margin: SPACING.md, marginBottom: SPACING.xs },
  chips: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  list: { padding: SPACING.md, paddingTop: SPACING.xs, paddingBottom: 80 },
  card: { marginBottom: SPACING.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  propName: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600', flex: 1 },
  badge: {
    color: COLORS.primary, fontSize: FONTS.xs, fontWeight: '600',
    textTransform: 'uppercase', marginLeft: SPACING.sm,
  },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 2 },
  addr: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  fab: {
    position: 'absolute', bottom: SPACING.xl, right: SPACING.xl,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3,
  },
  fabIcon: { color: COLORS.white, fontSize: 28, lineHeight: 32 },
});

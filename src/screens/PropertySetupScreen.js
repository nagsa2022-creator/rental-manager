import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Switch,
  TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, CARD_STYLE, FONTS, INPUT_STYLE, BTN } from '../constants/theme';
import {
  getFloorsByProperty, getRoomsByFloor, getRoomsByProperty,
  saveFloor, deleteFloor, saveRoom, deleteRoom,
} from '../database/queries';

export default function PropertySetupScreen({ route, navigation }) {
  const { property_id, property_name, has_floors } = route.params || {};

  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState({}); // keyed by floor_id or 'none'
  const [newFloorName, setNewFloorName] = useState('');
  const [newRoomName, setNewRoomName] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: property_name || 'Property Setup' });
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    try {
      if (has_floors) {
        const floorList = await getFloorsByProperty(property_id);
        setFloors(floorList);
        const roomMap = {};
        for (const f of floorList) {
          roomMap[f.id] = await getRoomsByFloor(f.id);
        }
        setRooms(roomMap);
      } else {
        const direct = await getRoomsByProperty(property_id);
        setRooms({ none: direct });
      }
    } finally {
      setLoading(false);
    }
  }

  // -- FLOORS --

  async function handleAddFloor() {
    const name = newFloorName.trim();
    if (!name) return;
    try {
      await saveFloor({ property_id, name, has_submeter: 0 });
      setNewFloorName('');
      await load();
    } catch {
      Alert.alert('Error', 'Could not add floor.');
    }
  }

  async function handleToggleSubmeter(floor) {
    try {
      await saveFloor({ ...floor, has_submeter: floor.has_submeter ? 0 : 1 });
      await load();
    } catch {
      Alert.alert('Error', 'Could not update floor.');
    }
  }

  async function handleDeleteFloor(floor) {
    Alert.alert('Delete Floor', `Delete "${floor.name}" and all its rooms?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteFloor(floor.id);
            await load();
          } catch {
            Alert.alert('Error', 'Could not delete floor.');
          }
        },
      },
    ]);
  }

  // -- ROOMS --

  async function handleAddRoom(floorId) {
    const name = (newRoomName[floorId ?? 'none'] || '').trim();
    if (!name) return;
    try {
      await saveRoom({ property_id, floor_id: floorId || null, name });
      setNewRoomName(m => ({ ...m, [floorId ?? 'none']: '' }));
      await load();
    } catch {
      Alert.alert('Error', 'Could not add room.');
    }
  }

  async function handleDeleteRoom(room) {
    Alert.alert('Delete Room', `Delete room "${room.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoom(room.id);
            await load();
          } catch {
            Alert.alert('Error', 'Could not delete room.');
          }
        },
      },
    ]);
  }

  function toggleExpand(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  }

  function RoomSection({ floorId, label }) {
    const key = floorId ?? 'none';
    const roomList = rooms[key] || [];
    return (
      <View style={styles.roomSection}>
        {roomList.map(r => (
          <View key={r.id} style={styles.roomRow}>
            <Text style={styles.roomName}>{r.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteRoom(r)} style={styles.delBtn}>
              <Text style={styles.delText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={[INPUT_STYLE, styles.addInput]}
            placeholder={`Add room${label ? ' to ' + label : ''}...`}
            placeholderTextColor={COLORS.placeholder}
            value={newRoomName[key] || ''}
            onChangeText={v => setNewRoomName(m => ({ ...m, [key]: v }))}
            onSubmitEditing={() => handleAddRoom(floorId)}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[BTN.outline, styles.addBtn]}
            onPress={() => handleAddRoom(floorId)}
          >
            <Text style={BTN.outlineText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      {/* No-floors mode: rooms directly under property */}
      {!has_floors && (
        <View style={[CARD_STYLE, styles.card]}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <RoomSection floorId={null} label={null} />
        </View>
      )}

      {/* Floors mode */}
      {has_floors && (
        <>
          <Text style={styles.sectionTitle}>Floors</Text>

          {floors.map(floor => (
            <View key={floor.id} style={[CARD_STYLE, styles.card]}>
              <TouchableOpacity style={styles.floorHeader} onPress={() => toggleExpand(floor.id)}>
                <Text style={styles.floorName}>{floor.name}</Text>
                <Text style={styles.chevron}>{expanded[floor.id] ? 'v' : '>'}</Text>
              </TouchableOpacity>

              <View style={styles.floorMeta}>
                <Text style={styles.metaLabel}>Submeter</Text>
                <Switch
                  value={!!floor.has_submeter}
                  onValueChange={() => handleToggleSubmeter(floor)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
                <TouchableOpacity onPress={() => handleDeleteFloor(floor)} style={styles.delBtnFloor}>
                  <Text style={styles.delText}>Delete Floor</Text>
                </TouchableOpacity>
              </View>

              {expanded[floor.id] && (
                <RoomSection floorId={floor.id} label={floor.name} />
              )}
            </View>
          ))}

          {/* Add floor */}
          <View style={[CARD_STYLE, styles.card]}>
            <Text style={styles.metaLabel}>Add Floor</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[INPUT_STYLE, styles.addInput]}
                placeholder="Floor name (e.g. Ground Floor)"
                placeholderTextColor={COLORS.placeholder}
                value={newFloorName}
                onChangeText={setNewFloorName}
                onSubmitEditing={handleAddFloor}
                returnKeyType="done"
              />
              <TouchableOpacity style={[BTN.outline, styles.addBtn]} onPress={handleAddFloor}>
                <Text style={BTN.outlineText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600', marginBottom: SPACING.sm },
  card: { marginBottom: SPACING.sm },
  floorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  floorName: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600' },
  chevron: { color: COLORS.textMuted, fontSize: FONTS.md, paddingHorizontal: SPACING.xs },
  floorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  metaLabel: { color: COLORS.textMuted, fontSize: FONTS.sm, flex: 1 },
  delBtnFloor: { marginLeft: SPACING.sm },
  roomSection: { marginTop: SPACING.sm, borderTopWidth: 1, borderColor: COLORS.border, paddingTop: SPACING.sm },
  roomRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.xs, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  roomName: { color: COLORS.text, fontSize: FONTS.sm, flex: 1 },
  delBtn: { paddingHorizontal: SPACING.sm },
  delText: { color: COLORS.danger, fontSize: FONTS.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  addInput: { flex: 1, marginBottom: 0 },
  addBtn: { paddingHorizontal: SPACING.md },
});

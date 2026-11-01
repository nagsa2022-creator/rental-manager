import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { getDatabase } from './src/database/database';
import { COLORS, NAV_THEME } from './src/constants/theme';

import HomeScreen from './src/screens/HomeScreen';
import OwnersScreen from './src/screens/OwnersScreen';
import AddOwnerScreen from './src/screens/AddOwnerScreen';
import OwnerDetailScreen from './src/screens/OwnerDetailScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PropertySetupScreen from './src/screens/PropertySetupScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import TenantsScreen from './src/screens/TenantsScreen';
import AddTenantScreen from './src/screens/AddTenantScreen';
import TenantDetailScreen from './src/screens/TenantDetailScreen';
import MonthlyBillingScreen from './src/screens/MonthlyBillingScreen';
import DuesSummaryScreen from './src/screens/DuesSummaryScreen';
import OwnerPayoutScreen from './src/screens/OwnerPayoutScreen';
import AnnualSummaryScreen from './src/screens/AnnualSummaryScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: COLORS.bg, card: '#010409', text: COLORS.text, border: COLORS.border },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { await getDatabase(); setReady(true); }
      catch (e) { setError(String(e)); }
    })();
  }, []);

  if (error) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 30 }}>
      <Text style={{ color: COLORS.danger, fontSize: 16 }}>Database Error</Text>
      <Text style={{ color: COLORS.textSecondary, marginTop: 10, fontSize: 13 }}>{error}</Text>
    </View>
  );
  if (!ready) return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={NAV_THEME}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Rental Manager' }} />
          <Stack.Screen name="Owners" component={OwnersScreen} options={{ title: 'Owners' }} />
          <Stack.Screen name="AddOwner" component={AddOwnerScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit Owner' : 'Add Owner' })} />
          <Stack.Screen name="OwnerDetail" component={OwnerDetailScreen} options={({ route }) => ({ title: route.params?.name || 'Owner' })} />
          <Stack.Screen name="Properties" component={PropertiesScreen} options={{ title: 'Properties' }} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit Property' : 'Add Property' })} />
          <Stack.Screen name="PropertySetup" component={PropertySetupScreen} options={{ title: 'Property Setup' }} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={({ route }) => ({ title: route.params?.name || 'Property' })} />
          <Stack.Screen name="Tenants" component={TenantsScreen} options={{ title: 'Tenants' }} />
          <Stack.Screen name="AddTenant" component={AddTenantScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit Tenant' : 'Add Tenant' })} />
          <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: route.params?.name || 'Tenant' })} />
          <Stack.Screen name="MonthlyBilling" component={MonthlyBillingScreen} options={{ title: 'Monthly Billing' }} />
          <Stack.Screen name="DuesSummary" component={DuesSummaryScreen} options={{ title: 'Dues Summary' }} />
          <Stack.Screen name="OwnerPayout" component={OwnerPayoutScreen} options={{ title: 'Owner Payout' }} />
          <Stack.Screen name="AnnualSummary" component={AnnualSummaryScreen} options={{ title: 'Annual Summary' }} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

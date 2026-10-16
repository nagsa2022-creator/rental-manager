import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from './src/database/database';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import TenantsScreen from './src/screens/TenantsScreen';
import AddTenantScreen from './src/screens/AddTenantScreen';
import TenantDetailScreen from './src/screens/TenantDetailScreen';
import AddBillScreen from './src/screens/AddBillScreen';
import PayViaUPIScreen from './src/screens/PayViaUPIScreen';
import ElectricityScreen from './src/screens/ElectricityScreen';
import ExpenseLogScreen from './src/screens/ExpenseLogScreen';
import BackupScreen from './src/screens/BackupScreen';

const Stack = createNativeStackNavigator();

const THEME = {
  headerStyle: { backgroundColor: '#1A5276' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      await getDatabase();
      setDbReady(true);
    }
    init();
  }, []);

  if (!dbReady) return null;

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={THEME}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Rental Manager' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="Properties" component={PropertiesScreen} options={{ title: 'My Properties' }} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ title: 'Add Property' }} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={({ route }) => ({ title: route.params.propertyName })} />
          <Stack.Screen name="Tenants" component={TenantsScreen} options={({ route }) => ({ title: `${route.params.propertyName} - Tenants` })} />
          <Stack.Screen name="AddTenant" component={AddTenantScreen} options={{ title: 'Add Tenant' }} />
          <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: route.params.tenantName })} />
          <Stack.Screen name="AddBill" component={AddBillScreen} options={{ title: 'Add Monthly Bill' }} />
          <Stack.Screen name="PayViaUPI" component={PayViaUPIScreen} options={{ title: 'UPI Payment' }} />
          <Stack.Screen name="Electricity" component={ElectricityScreen} options={{ title: 'Electricity Split' }} />
          <Stack.Screen name="ExpenseLog" component={ExpenseLogScreen} options={({ route }) => ({ title: `${route.params.propertyName} - Expenses` })} />
          <Stack.Screen name="Backup" component={BackupScreen} options={{ title: 'Backup & Restore' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

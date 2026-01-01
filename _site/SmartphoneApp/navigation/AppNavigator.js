import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ScanTicketScreen from '../screens/ScanTicketScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import SchedulesScreen from '../screens/SchedulesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

/**
 * Main App Navigator
 * Defines the navigation structure for the app
 */
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#020617',
          },
          headerTintColor: '#38bdf8',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: '#020617',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'AFRICA RAILWAYS',
            headerShown: true,
          }}
        />
        
        <Stack.Screen 
          name="ScanTicket" 
          component={ScanTicketScreen}
          options={{
            title: 'Scan Ticket',
            headerShown: true,
          }}
        />
        
        <Stack.Screen 
          name="TicketDetails" 
          component={TicketDetailsScreen}
          options={{
            title: 'Ticket Details',
            headerShown: true,
          }}
        />
        
        <Stack.Screen 
          name="Schedules" 
          component={SchedulesScreen}
          options={{
            title: 'Train Schedules',
            headerShown: true,
          }}
        />
        
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

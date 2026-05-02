import React from 'react';
import {
  SafeAreaView,
  StyleSheet, Platform
} from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import TeamsHomeScreen from './TeamsHomeScreen';
import SettingsScreen from './SettingsScreen';
import AsignacionesP from './Personal/AsignacionesP';
const Tab = createBottomTabNavigator();

export default function HomeTabs({ navigation }) {
  function screenOptions(route) {
    return {
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'TeamsHome') iconName = 'people';
        else if (route.name === 'Personal') iconName = 'person';
        else if (route.name === 'Settings') iconName = 'settings';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#d44e00',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        position: 'absolute',
        borderRadius: 1,
        height: 80,
        backgroundColor: Platform.OS == 'ios' ? 'transparent' : '#141414',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopWidth: 0,
      },
      tabBarBackground: function () {
        if (Platform.OS == 'ios'){
          return <BlurView intensity={60} tint="dark" style={{ flex: 1 }} />;
        }
      },
    };
  }
  return (
    <Tab.Navigator screenOptions={({ route }) => screenOptions(route)}>
      {/* 🔸 Equipos: se queda como antes, abre su pantalla */}
      <Tab.Screen
        name="TeamsHome"
        component={TeamsHomeScreen}
        options={{ title: 'Equipos' }}
      />

      {/* 🔹 Personal: al presionar, abre los tabs personales */}
      <Tab.Screen
        name="Personal"
        component={AsignacionesP}
        options={{ title: 'Personal' }}
      />

      {/* ⚙️ Ajustes */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}

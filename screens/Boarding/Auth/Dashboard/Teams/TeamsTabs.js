import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet, Platform} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons , FontAwesome5 } from '@expo/vector-icons';
import KanbanScreen from './KanbanScreen';
import MembersScreen from './MembersScreen';
import BitacoraScreen from './Bitacoras/BitacoraScreen';
import TeamsHomeScreen from '../TeamsHomeScreen';
import CreateBitacora from './Bitacoras/CreateBitacoraScreen';
import { BlurView } from 'expo-blur';

import CreateBitacoraScreen from './Bitacoras/CreateBitacoraScreen';
import HomeTabs from '../HomeTabs'; // tu stack de Home

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🔹 Stack para Bitácora
function BitacoraStack({ route }) {
  const { teamId } = route.params;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BitacoraMain" component={BitacoraScreen} initialParams={{ teamId }} />
      <Stack.Screen name="CreateBitacora" component={CreateBitacoraScreen} />
      <Stack.Screen name="TeamsHomeScreen" component={TeamsHomeScreen}/>
    </Stack.Navigator>
  );
}
function EmptyScreen() {
  return null; // ✅ Evita error de navegación
}
export default function TeamsTabs({ route, navigation }) {
  const { teamId, teamName } = route.params || {};

  function getScreenOptions(route) {
    return {
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Kanban') iconName = 'table-chart';
        else if (route.name === 'Home') iconName = 'home-filled';
        else if (route.name === 'Bitácora') iconName = 'menu-book'; 
        else if (route.name === 'Miembros') iconName = 'people-alt';
        else if (route.name === 'Ajustes') iconName = 'settings';
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#d44e00',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        position: 'absolute',
        borderRadius: 1,
        height: 80,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#141414',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopWidth: 0,
      },
      tabBarBackground: () => {
        if (Platform.OS === 'ios') {
          return <BlurView intensity={60} tint="dark" style={{ flex: 1 }} />;
        }
        return null;
      },
    };
  }

  function handleHomePress(e) {
    e.preventDefault();
    navigation.replace('HomeTabs');
  }

  return (
    <Tab.Navigator
      initialRouteName="Kanban"
      screenOptions={({ route }) => getScreenOptions(route)}
    >
      <Tab.Screen
        name="Home"
        component={EmptyScreen}
        listeners={{ tabPress: handleHomePress }}
      />
      <Tab.Screen 
        name="Kanban" 
        component={KanbanScreen}
        initialParams={{ teamId, teamName }}
      />
      <Tab.Screen 
        name="Bitácora" 
        component={BitacoraStack}
        initialParams={{ teamId, teamName }}
      />
      <Tab.Screen 
        name="Miembros" 
        component={MembersScreen}
        initialParams={{ teamId, teamName, rootNavigation: navigation}}
      />
    </Tab.Navigator>
  );
}

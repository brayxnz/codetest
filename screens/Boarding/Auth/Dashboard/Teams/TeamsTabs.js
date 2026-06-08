// screens/Teams/TeamTabs.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import KanbanScreen from './KanbanScreen';
import MembersScreen from './MembersScreen';
import BitacoraScreen from './Bitacoras/BitacoraScreen';
import TeamsHomeScreen from '../TeamsHomeScreen';
import CreateBitacoraScreen from './Bitacoras/CreateBitacoraScreen';
import { BlurView } from 'expo-blur';
import { supabase } from '../../../../../CBD';
import FilesScreen from './TeamFiles';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🔹 Stack para Bitácora
function BitacoraStack({ route }) {
  const { teamId, teamName } = route.params;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BitacoraMain"
        component={BitacoraScreen}
        initialParams={{ teamId, teamName }}
      />
      <Stack.Screen name="CreateBitacora" component={CreateBitacoraScreen} />
      <Stack.Screen name="TeamsHomeScreen" component={TeamsHomeScreen} />
    </Stack.Navigator>
  );
}

function EmptyScreen() {
  return null;
}

export default function TeamsTabs({ route, navigation }) {
  const { teamId, teamName } = route.params || {};

  const [isBoosted, setIsBoosted] = useState(false);
  const [boostLoading, setBoostLoading] = useState(true);

  // 🔹 Cargar estado de boost del equipo
  useEffect(() => {
    const loadBoostState = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('is_boosted')
          .eq('id_team', teamId)
          .single();

        if (!error && data) {
          setIsBoosted(!!data.is_boosted);
        } else {
          console.log('Error cargando is_boosted:', error);
        }
      } catch (e) {
        console.log('Error loadBoostState:', e);
      } finally {
        setBoostLoading(false);
      }
    };

    if (teamId) {
      loadBoostState();
    }
  }, [teamId]);

  function getScreenOptions(route) {
    return {
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Kanban') iconName = 'table-chart';
        else if (route.name === 'Home') iconName = 'home-filled';
        else if (route.name === 'Bitácora') iconName = 'menu-book';
        else if (route.name === 'Miembros') iconName = 'people-alt';
        else if (route.name === 'Archivos') iconName = 'folder';
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

      {/* 🔹 Almacenamiento solo si el equipo está boosteado */}
      {isBoosted && (
        <Tab.Screen
          name="Archivos"
          component={FilesScreen}
          initialParams={{ teamId, teamName }}
        />
      )}

      <Tab.Screen
        name="Miembros"
        component={MembersScreen}
        initialParams={{ teamId, teamName, rootNavigation: navigation }}
      />
    </Tab.Navigator>
  );
}
// screens/Teams/TeamSettings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import supabase from '../../../../../CBD';


export default function TeamSettings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { teamId } = route.params;

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("cargando");

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm(`${title}\n\n${message}`);
      if (confirm && buttons && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadTeam(), loadRole()]);
    setLoading(false);
  }

  async function loadTeam() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id_team', teamId)
      .single();

    if (!error) setTeam(data);
  }

  // 🔥 FIX REAL DEL PROBLEMA: usar getSession()
  async function loadRole() {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user) {
      console.log("NO HAY SESIÓN");
      setRole("none");
      return;
    }

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('id_team', teamId)
      .eq('id_user', userId)
      .single();

    if (!error && data) {
      console.log("ROL:", data.role);
      setRole(data.role);
    } else {
      console.log("ERROR ROLE:", error);
      setRole("none");
    }
  }

  async function deleteTeam() {
    showAlert(
      'Eliminar equipo',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('teams').delete().eq('id_team', teamId);

            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeTabs' }],
            });
          },
        },
      ]
    );
  }

  async function leaveTeam() {
    showAlert(
      'Salir del equipo',
      '¿Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session.user.id;

            await supabase
              .from('team_members')
              .delete()
              .eq('id_team', teamId)
              .eq('id_user', userId);

            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeTabs' }],
            });
          },
        },
      ]
    );
  }

  if (loading || role === "cargando") {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d44e00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#141414' }}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del equipo</Text>

          <View style={styles.optionRow}>
            <Ionicons name="people-outline" size={20} color="#fff" />
            <Text style={styles.optionText}>{team?.team_name}</Text>
          </View>
        </View>

        {/* SOLO PO */}
        {role === "Product Owner" && (
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteTeam}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={styles.deleteText}>Eliminar equipo</Text>
          </TouchableOpacity>
        )}

        {/* LOS DEMÁS */}
        {role !== "Product Owner" && (
          <TouchableOpacity style={styles.leaveBtn} onPress={leaveTeam}>
            <Ionicons name="log-out-outline" size={20} color="#FACC15" />
            <Text style={styles.leaveText}>Salir del equipo</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>Configuración del equipo</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
    color: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 14,
    backgroundColor: '#FF6B3522', // Transparencia sutil
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  deleteText: {
    color: '#FF6B35',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  leaveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#252525', // gris oscuro
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252525',
  },
  leaveText: {
    color: '#FF6B35', // mismo color de acento
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 12,
  },
});


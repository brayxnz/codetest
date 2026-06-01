import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../../../../CBD';

export default function TeamsHomeScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState(null); // "create", "join", "menu"
  const [modalLoading, setModalLoading] = useState(false);

  // Campos del formulario
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTeams();
    }
  }, [userId]);

  // Cargar ID del usuario desde AsyncStorage
  const loadUserId = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        setUserId(userData.id_user);
      }
    } catch (error) {
      console.log('Error al cargar user ID:', error);
    }
  };

  // Obtener equipos del usuario desde la BD
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id_member,
          role,
          teams!inner (
            id_team,
            team_name,
            join_code
          )
        `)
        .eq('id_user', userId);

      if (error) {
        console.error('Error al cargar equipos:', error);
        return;
      }

      // Transformar los datos al formato esperado
      const teamsData = data.map(item => ({
        id: item.teams.id_team.toString(),
        name: item.teams.team_name,
        code: item.teams.join_code,
        role: item.role,
        description: `Rol: ${item.role}`,
      }));

      setTeams(teamsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generar código aleatorio de 6 caracteres
  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Abrir modal
  function openModal(type) {
    setMode(type);
    setModalVisible(true);
  }

  // Cerrar modal y limpiar campos
  function closeModal() {
    setModalVisible(false);
    setMode(null);
    setTeamName('');
    setTeamDesc('');
    setJoinCode('');
  }

  // Crear un nuevo equipo
  async function handleCreateTeam() {
    if (!teamName.trim()) {
      Alert.alert('Error', 'El nombre del equipo es obligatorio');
      return;
    }

    setModalLoading(true);

    try {
      const newJoinCode = generateCode();

      // 1. Insertar el equipo
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            team_name: teamName.trim(),
            join_code: newJoinCode,
          }
        ])
        .select()
        .single();

      if (teamError) {
        console.error('Error al crear equipo:', teamError);
        Alert.alert('Error', 'No se pudo crear el equipo');
        setModalLoading(false);
        return;
      }

      const { error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            id_team: newTeam.id_team,
            id_user: userId,
            role: 'Product Owner',
          }
        ]);

      if (memberError) {
        console.error('Error al agregar miembro:', memberError);
        Alert.alert('Error', 'Equipo creado pero no se pudo agregar como miembro');
        setModalLoading(false);
        return;
      }

      // Actualizar la lista
      await fetchTeams();
      setModalLoading(false);
      closeModal();
      Alert.alert(
        'Éxito',
        `Equipo "${teamName}" creado correctamente\nCódigo: ${newJoinCode}`,
        [{ text: 'oki doki'}]
      );

    } catch (error) {
      console.error('Error en crear equipo:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setModalLoading(false);
    }
  }

  // Unirse a un equipo
  async function handleJoinTeam() {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Ingresa el código del equipo');
      return;
    }

    setModalLoading(true);

    try {
      // 1. Buscar el equipo por join_code
      const { data: foundTeam, error: searchError } = await supabase
        .from('teams')
        .select('id_team, team_name, join_code')
        .eq('join_code', joinCode.trim().toUpperCase())
        .single();

      if (searchError || !foundTeam) {
        Alert.alert('Error', 'Código incorrecto o equipo no encontrado');
        setModalLoading(false);
        return;
      }

      // 2. Verificar si ya es miembro
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id_member')
        .eq('id_team', foundTeam.id_team)
        .eq('id_user', userId)
        .single();

      if (existingMember) {
        Alert.alert('Aviso', 'Ya eres miembro de este equipo');
        setModalLoading(false);
        closeModal();
        return;
      }

      // 3. Agregar como miembro
      const { error: joinError } = await supabase.from('team_members').insert([
          {
            id_team: foundTeam.id_team,
            id_user: userId,
            role: 'Desarrollador',
          }
        ]);

      if (joinError) {
        console.error('Error al unirse:', joinError);
        Alert.alert('Error', 'No se pudo unir al equipo');
        setModalLoading(false);
        return;
      }

      // Actualizar la lista
      await fetchTeams()
      ;setModalLoading(false);
      closeModal();
      Alert.alert(
        'Éxito',
        `Te has unido al equipo "${foundTeam.team_name}"`,
        [{ text: 'OK', onPress: closeModal }]
      );

    } catch (error) {
      console.error('Error al unirse:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setModalLoading(false);
    }
  }

  // Entrar al equipo desde la tarjeta
  function goToTeam(team) {
    // Aquí puedes pasar el id del equipo a la siguiente pantalla
    navigation.navigate('TeamsTabs', { 
      teamId: team.id,
      teamName: team.name 
    });
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d44e00" />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0a0a0a', paddingTop: 40 }}>
      <StatusBar style="light" />
      <Text style={styles.title}>Mis Equipos</Text>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#d44e00']}
            tintColor="#d44e00"
          />
        }
      >
        <View style={styles.container}>

          {/* Lista de equipos */}
          {teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No tienes equipos aún</Text>
              <Text style={styles.emptySubtext}>
                Crea un equipo o únete a uno existente
              </Text>
            </View>
          ) : (
            <FlatList
              data={teams}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.teamCard}
                  onPress={() => goToTeam(item)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="people" size={32} color="#d44e00" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.teamName}>{item.name}</Text>
                    <Text style={styles.teamDesc}>{item.description}</Text>
                    <Text style={styles.teamCode}>Código: {item.code}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openModal('menu')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* ---------- MODAL ---------- */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* MENÚ */}
            {mode === 'menu' && (
              <>
                <Text style={styles.modalTitle}>Equipo</Text>

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setMode('create')}
                >
                  <Ionicons name="add-circle-outline" size={22} color="white" />
                  <Text style={styles.modalBtnText}>Crear Equipo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setMode('join')}
                >
                  <Ionicons name="log-in-outline" size={22} color="white" />
                  <Text style={styles.modalBtnText}>Unirse a Equipo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={closeModal}
                >
                  <Text style={styles.closeText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}

            {/* FORMULARIO: CREAR EQUIPO */}
            {mode === 'create' && (
              <>
                <Text style={styles.modalTitle}>Crear Equipo</Text>

                <Text style={styles.label}>Nombre del Equipo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: CodeNest Devs"
                  placeholderTextColor="#aaa"
                  value={teamName}
                  onChangeText={setTeamName}
                  editable={!modalLoading}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, modalLoading && styles.btnDisabled]}
                  onPress={handleCreateTeam}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveText}>Crear</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setMode('menu')}
                  disabled={modalLoading}
                >
                  <Text style={styles.closeText}>Regresar</Text>
                </TouchableOpacity>
              </>
            )}

            {/* FORMULARIO: UNIRSE */}
            {mode === 'join' && (
              <>
                <Text style={styles.modalTitle}>Unirse a un Equipo</Text>

                <Text style={styles.label}>Código del Equipo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABCDE1"
                  placeholderTextColor="#aaa"
                  autoCapitalize="characters"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  editable={!modalLoading}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, modalLoading && styles.btnDisabled]}
                  onPress={handleJoinTeam}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveText}>Unirse</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setMode('menu')}
                  disabled={modalLoading}
                >
                  <Text style={styles.closeText}>Regresar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    marginLeft: '6%',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8996b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  teamName: { fontSize: 18, fontWeight: '500', color: 'white' },
  teamDesc: { fontSize: 14, color: 'lightgray', marginTop: 2 },
  teamCode: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 105,
    width: 60,
    height: 60,
    borderRadius: 32,
    backgroundColor: '#d44e00',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#d44e00',
    borderRadius: 10,
    marginBottom: 12,
  },
  modalBtnText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 10,
    padding: 10,
    alignSelf: 'center',
  },
  closeText: {
    color: '#d44e00',
    fontSize: 15,
  },

  // FORM
  label: { color: 'white', marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#d44e00',
    color: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#d44e00',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignSelf: 'center',
  },
});

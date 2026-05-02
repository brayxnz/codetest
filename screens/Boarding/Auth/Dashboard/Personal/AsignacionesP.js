import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../../../../../CBD';

export default function AsignacionesP() {
  const [tareas, setTareas] = useState([]);
  const [filtro, setFiltro] = useState('To Do');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) fetchTareas();
  }, [userId, filtro]);

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
  const fetchTareas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kb_tasks_asignaciones')
        .select(
          `
          id_assignment,
          kb_tasks!inner (
            id_task,
            title,
            description,
            id_status,
            kb_status!inner (
              id_status,
              status_name
            ),
            kb_table!inner (
              id_table,
              table_name,
              teams!inner (
                id_team,
                team_name
              )
            ),
            kb_tasks_asignaciones!inner (
              id_user,
              users!inner (
                name
              )
            )
          )
        `
        )
        .eq('id_user', userId)
        .eq('kb_tasks.kb_status.status_name', filtro);
      if (error) {
        console.error('Error al cargar tareas:', error);
        setTareas([]);
        return;
      }

      const tareasMap = new Map();

      data.forEach((asignacion) => {
        const tarea = asignacion.kb_tasks;
        const taskId = tarea.id_task;
        if (!tareasMap.has(taskId)) {
          tareasMap.set(taskId, {
            id: taskId.toString(),
            equipo: tarea.kb_table.teams.team_name,
            titulo: tarea.title,
            descripcion: tarea.description || '',
            estado: tarea.kb_status.status_name,
            id_status: tarea.id_status,
            asignados: [],
          });
        }
        tarea.kb_tasks_asignaciones.forEach((a) => {
          tareasMap.get(taskId).asignados.push(a.users.name);
        });
      });

      const tareasArray = Array.from(tareasMap.values()).map((t) => ({
        ...t,
        asignados:
          t.asignados.length > 0 ? t.asignados.join(', ') : 'Sin asignar',
      }));

      setTareas(tareasArray);
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setTareas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTareas();
  };

  // Abrir modal
  const handleLongPress = (tarea) => {
    setTareaSeleccionada(tarea);
    setModalVisible(true);
  };

  // Función para actualizar estado de tarea (Doing o Done)
  const actualizarEstado = async (nuevoEstado) => {
    if (!tareaSeleccionada) return;
    try {
      // Obtener id_status
      const { data: statusData, error: statusErr } = await supabase
        .from('kb_status')
        .select('id_status')
        .eq('status_name', nuevoEstado)
        .single();

      if (statusErr || !statusData) {
        Alert.alert('Error', `No se pudo obtener el estado ${nuevoEstado}`);
        return;
      }

      const { error } = await supabase
        .from('kb_tasks')
        .update({ id_status: statusData.id_status })
        .eq('id_task', tareaSeleccionada.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar la tarea.');
        return;
      }

      setModalVisible(false);

      // Actualizar lista local filtrando tareas que coinciden con el filtro
      if (nuevoEstado === filtro) {
        // Si el nuevo estado coincide con el filtro, solo actualizar estado
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tareaSeleccionada.id
              ? { ...t, estado: nuevoEstado, id_status: statusData.id_status }
              : t
          )
        );
      } else {
        // Si no coincide, removerla del arreglo actual
        setTareas((prev) => prev.filter((t) => t.id !== tareaSeleccionada.id));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity onLongPress={() => handleLongPress(item)}>
      <View style={styles.taskCard}>
        <Text style={styles.taskTitle}>{item.equipo}</Text>
        <Text style={styles.taskModule}>{item.titulo}</Text>
        {item.descripcion ? (
          <Text style={styles.taskDescription}>{item.descripcion}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: 'gray', fontWeight: 'bold' }}>
            Miembros asignados: {item.asignados}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: 'gray', marginTop: 4 }}>
          Estado: {item.estado}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.cont}>
        <Text style={styles.header}>Mis Tareas</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d44e00" />
          <Text style={styles.loadingText}>Cargando tareas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.cont}>
      <Text style={styles.header}>Mis Tareas</Text>

      <View style={styles.contFiltro}>
        <TouchableOpacity
          style={[styles.btnFiltro, filtro === 'To Do' && styles.activeFilter]}
          onPress={() => setFiltro('To Do')}>
          <Text style={styles.filterText}>To Do</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnFiltro, filtro === 'Doing' && styles.activeFilter]}
          onPress={() => setFiltro('Doing')}>
          <Text style={styles.filterText}>Doing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnFiltro, filtro === 'Done' && styles.activeFilter]}
          onPress={() => setFiltro('Done')}>
          <Text style={styles.filterText}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#d44e00']}
            tintColor="#d44e00"
          />
        }>
        <FlatList
          data={tareas}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color="#666" />
              <Text style={styles.empty}>No hay tareas en {filtro}</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tareaSeleccionada?.titulo}</Text>
            <Text style={styles.modalEquipo}>
              Equipo: {tareaSeleccionada?.equipo}
            </Text>
            <Text style={styles.modalDesc}>
              {tareaSeleccionada?.descripcion}
            </Text>
            <Text style={styles.modalAsignados}>
              Miembros: {tareaSeleccionada?.asignados}
            </Text>
            <Text style={styles.modalEstado}>
              Estado: {tareaSeleccionada?.estado}
            </Text>

            {tareaSeleccionada?.estado !== 'Doing' && (
              <TouchableOpacity
                style={[styles.btnDone, { backgroundColor: '#f39c12' }]}
                onPress={() => actualizarEstado('Doing')}>
                <Text style={styles.btnTxt}>Marcar como Doing</Text>
              </TouchableOpacity>
            )}
            {tareaSeleccionada?.estado !== 'Done' && (
              <TouchableOpacity
                style={styles.btnDone}
                onPress={() => actualizarEstado('Done')}>
                <Text style={styles.btnTxt}>Marcar como Done</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.btnClose}
              onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#d44e00', fontWeight: 'bold' }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cont: { flex: 1, paddingTop: 40, backgroundColor: '#0a0a0a' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    marginLeft: '6%',
    color: 'white',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 },
  contFiltro: {
    items: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  btnFiltro: {
    paddingVertical: 8,
    alignItems: 'center',
    width: '28%',
    borderRadius: 20,
    marginLeft: 5,
    marginRight: 5,
    backgroundColor: '#e8996b',
  },
  activeFilter: { backgroundColor: '#d44e00' },
  filterText: { color: 'white', fontWeight: '600' },
  taskCard: {
    width: '90%',
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderRightWidth: 10,
    borderRightColor: '#d44e00',
    alignSelf: 'center',
    padding: 16,
    marginBottom: 10,
  },
  taskTitle: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  taskModule: { fontSize: 14, color: 'lightgray', marginTop: 4 },
  taskDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 16, fontSize: 16 },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1c1c1c',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalEquipo: { color: 'lightgray', marginBottom: 4 },
  modalDesc: { color: '#9CA3AF', marginBottom: 8 },
  modalAsignados: { color: 'gray', marginBottom: 4 },
  modalEstado: { color: 'gray', marginBottom: 16 },
  btnDone: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnClose: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTxt: { color: 'white', fontWeight: 'bold' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import supabase from '../../../../../CBD';
import { BlurView } from 'expo-blur';

export default function KanbanScreen({ route }) {
  const { teamId } = route.params;
  const [tables, setTables] = useState([]);
  const [currentTable, setCurrentTable] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para Modal de CREACIÓN de Tarea
  const [modalTaskVisible, setModalTaskVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatusId, setNewTaskStatusId] = useState(null);

  // Estado para Modal de EDICIÓN de Tarea (Nuevo)
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Tarea actual en edición
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStatusId, setEditTaskStatusId] = useState(null);
  const [editSelectedMembers, setEditSelectedMembers] = useState([]); // Asignados de la tarea a editar

  const [modalTableVisible, setModalTableVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // Asignados para la creación

  const canonicalFases = [
    'La Idea',
    'Definición del problema o necesidad',
    'Fundamentos teóricos',
    'Diseño de la investigación',
    'Diseño de la ingeniería',
    'Presentación de resultados',
  ];

  useEffect(() => {
    init();
  }, [teamId]);

  async function init() {
    setLoading(true);
    await loadStatuses();
    await loadTablesAndEnsureFases();
    await loadTeamMembers();
    setLoading(false);
  }

  async function loadStatuses() {
    const { data, error } = await supabase
      .from('kb_status')
      .select('*')
      .order('id_status', { ascending: true });

    if (error || !data) {
      setStatuses([
        { id_status: 1, status_name: 'To Do' },
        { id_status: 2, status_name: 'Doing' },
        { id_status: 3, status_name: 'Done' },
      ]);
      setNewTaskStatusId(1);
      return;
    }
    setStatuses(data);
    if (data?.length) setNewTaskStatusId(data[0].id_status);
  }

  async function loadTablesAndEnsureFases() {
    const { data: existing, error } = await supabase
      .from('kb_table')
      .select('*')
      .eq('id_team', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error cargando tablas:', error.message);
      return;
    }

    const existingNames = (existing || []).map((t) => t.table_name);
    const faltantes = canonicalFases.filter((f) => !existingNames.includes(f));

    if (faltantes.length > 0) {
      const payload = faltantes.map((f) => ({
        id_team: teamId,
        table_name: f,
      }));
      const { data: created, error: insertError } = await supabase
        .from('kb_table')
        .insert(payload)
        .select();

      if (!insertError) {
        const combined = [...(existing || []), ...(created || [])];
        const ordered = canonicalFases
          .map((name) => combined.find((t) => t.table_name === name))
          .filter(Boolean);
        setTables(ordered);
        setCurrentTable(ordered[0] || null);
        if (ordered[0]) await loadTasks(ordered[0].id_table);
        return;
      }
    }

    const ordered = canonicalFases
      .map((name) => (existing || []).find((t) => t.table_name === name))
      .filter(Boolean);
    setTables(ordered);
    setCurrentTable(ordered[0] || null);
    if (ordered[0]) await loadTasks(ordered[0].id_table);
  }

  async function loadTasks(id_table) {
    setLoading(true);
    // Cargar también las asignaciones para saber quién está asignado a cada tarea
    const { data, error } = await supabase
      .from('kb_tasks')
      .select('*, kb_tasks_asignaciones(id_user)')
      .eq('id_table', id_table)
      .order('id_task', { ascending: true });

    if (!error) {
      const tasksWithAssignments = (data || []).map((task) => ({
        ...task,
        assigned_members: (task.kb_tasks_asignaciones || []).map(
          (a) => a.id_user
        ),
      }));
      setTasks(tasksWithAssignments);
    }
    setLoading(false);
  }

  async function loadTeamMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
                id_user,
                role,
                users (
                    id_user,
                    name,
                    username
                )
                `
      )
      .eq('id_team', teamId);

    if (!error && data) {
      const members = data.map((item) => ({
        id_user: item.id_user,
        name: item.users?.name || item.users?.username || 'Usuario',
        username: item.users?.username || '',
        role: item.role || 'Miembro',
      }));
      setTeamMembers(members);
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return Alert.alert('Título obligatorio');
    if (!currentTable) return Alert.alert('Selecciona un tablero');

    const payload = {
      id_table: currentTable.id_table,
      id_status: newTaskStatusId,
      title: newTaskTitle,
      description: newTaskDescription || null,
    };

    const { data: newTask, error } = await supabase
      .from('kb_tasks')
      .insert([payload])
      .select()
      .single();

    if (error) return Alert.alert('Error', error.message);

    // Asignar miembros a la tarea
    if (selectedMembers.length > 0 && newTask) {
      const assignments = selectedMembers.map((userId) => ({
        id_task: newTask.id_task,
        id_user: userId,
      }));
      const { error: assignError } = await supabase
        .from('kb_tasks_asignaciones')
        .insert(assignments);

      if (assignError) {
        console.warn('Error asignando miembros:', assignError.message);
      }
    }

    setModalTaskVisible(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedMembers([]);
    await loadTasks(currentTable.id_table);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!editTaskTitle.trim()) return Alert.alert('Título obligatorio');

    const payload = {
      title: editTaskTitle,
      description: editTaskDescription || null,
      id_status: editTaskStatusId,
    };

    // 1. Actualizar la tarea
    const { error: updateError } = await supabase
      .from('kb_tasks')
      .update(payload)
      .eq('id_task', editingTask.id_task);

    if (updateError)
      return Alert.alert('Error al actualizar tarea', updateError.message);

    // 2. Sincronizar asignaciones
    const currentAssignments = editingTask.assigned_members;
    const toAdd = editSelectedMembers.filter(
      (id) => !currentAssignments.includes(id)
    );
    const toRemove = currentAssignments.filter(
      (id) => !editSelectedMembers.includes(id)
    );

    // Eliminar asignaciones
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('kb_tasks_asignaciones')
        .delete()
        .eq('id_task', editingTask.id_task)
        .in('id_user', toRemove);
      if (deleteError)
        console.warn('Error al eliminar asignaciones:', deleteError.message);
    }

    // Agregar asignaciones
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map((userId) => ({
        id_task: editingTask.id_task,
        id_user: userId,
      }));
      const { error: insertError } = await supabase
        .from('kb_tasks_asignaciones')
        .insert(newAssignments);
      if (insertError)
        console.warn('Error al insertar asignaciones:', insertError.message);
    }

    setModalEditVisible(false);
    setEditingTask(null);
    await loadTasks(currentTable.id_table); // Recargar las tareas
  };

  const toggleMemberSelection = (userId, type = 'create') => {
    if (type === 'create') {
      setSelectedMembers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    } else {
      setEditSelectedMembers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleLongPress = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskStatusId(task.id_status);
    setEditSelectedMembers(task.assigned_members || []);
    setModalEditVisible(true);
  };

  const selectTable = async (table) => {
    setCurrentTable(table);
    setModalTableVisible(false);
    await loadTasks(table.id_table);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#d44e00" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0a0a0a', paddingTop: 40 }}>
      >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <MaterialIcons name="table-chart" size={28} color="#d44e00" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.header}>Tablero Kanban</Text>
              <Text style={styles.subtitle}>
                {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
              </Text>
            </View>
          </View>
        </View>

        {/* SELECTOR DE TABLEROS (BOTÓN) */}
        <View style={styles.pickerSection}>
          <View style={styles.pickerLabelContainer}>
            <Ionicons name="list" size={18} color="#d44e00" />
            <Text style={styles.pickerLabel}>Fase del proyecto</Text>
          </View>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setModalTableVisible(true)}
            activeOpacity={0.3}>
            <View style={styles.selectorContent}>
              <Ionicons name="folder-open" size={22} color="#d44e00" />
              <Text style={styles.selectorText} numberOfLines={1}>
                {currentTable?.table_name || 'Selecciona una fase'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={22} color="#d44e00" />
          </TouchableOpacity>
          {/* Indicador visual de fase actual */}
          {currentTable && (
            <View style={styles.phaseIndicator}>
              <View style={styles.phaseBar}>
                {tables.map((t) => (
                  <View
                    key={t.id_table}
                    style={[
                      styles.phaseSegment,
                      currentTable.id_table === t.id_table &&
                        styles.phaseSegmentActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.phaseText}>
                Fase{' '}
                {tables.findIndex((t) => t.id_table === currentTable.id_table) +
                  1}{' '}
                de {tables.length}
              </Text>
            </View>
          )}
        </View>

        {/* COLUMNAS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.boardContainer}>
          {statuses.map((status) => (
            <View key={status.id_status} style={styles.column}>
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>
                  {status.status_name === 'To Do'
                    ? '💡 Por hacer'
                    : status.status_name === 'Doing'
                    ? '🛠️ En Proceso'
                    : '✅ Completadas'}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {
                      tasks.filter((t) => t.id_status === status.id_status)
                        .length
                    }
                  </Text>
                </View>
              </View>
              <FlatList
                data={tasks.filter((t) => t.id_status === status.id_status)}
                keyExtractor={(item) => item.id_task.toString()}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={32}
                      color="#333"
                    />
                    <Text style={styles.emptyText}>Sin tareas</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  // AHORA ES UN TOUCHABLEOPACITY CON ONLONGPRESS
                  <TouchableOpacity
                    style={styles.card}
                    onLongPress={() => handleLongPress(item)}
                    activeOpacity={0.3}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={styles.detail} numberOfLines={3}>
                        {item.description}
                      </Text>
                    ) : null}
                    {/* Muestra los iniciales de los asignados */}
                    <View style={styles.assignedMembersContainer}>
                      {item.assigned_members
                        .slice(0, 3)
                        .map((userId, index) => {
                          const member = teamMembers.find(
                            (m) => m.id_user === userId
                          );
                          if (!member) return null;
                          return (
                            <View key={index} style={styles.miniAvatar}>
                              <Text style={styles.miniAvatarText}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          );
                        })}
                      {item.assigned_members.length > 3 && (
                        <View style={styles.miniAvatarMore}>
                          <Text style={styles.miniAvatarText}>
                            +{item.assigned_members.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          ))}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Limpiar estados de creación antes de abrir el modal
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskStatusId(statuses[0]?.id_status);
            setSelectedMembers([]);
            setModalTaskVisible(true);
          }}
          activeOpacity={0.3}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* MODAL SELECTOR DE TABLEROS */}
        <Modal
          transparent
          visible={modalTableVisible}
          animationType="slide"
          onRequestClose={() => setModalTableVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.tablePickerModal}>
              <View style={styles.tablePickerHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="albums" size={26} color="#d44e00" />
                  <Text style={styles.tablePickerTitle}>
                    Selecciona una Fase
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalTableVisible(false)}
                  style={styles.closeButton}>
                  <Ionicons name="close-circle" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.tableList}
                showsVerticalScrollIndicator={false}>
                {tables.map((table, index) => (
                  <TouchableOpacity
                    key={table.id_table}
                    style={[
                      styles.tableOption,
                      currentTable?.id_table === table.id_table &&
                        styles.tableOptionActive,
                    ]}
                    onPress={() => selectTable(table)}
                    activeOpacity={0.3}>
                    <View style={styles.tableOptionLeft}>
                      <View
                        style={[
                          styles.phaseNumber,
                          currentTable?.id_table === table.id_table &&
                            styles.phaseNumberActive,
                        ]}>
                        <Text
                          style={[
                            styles.phaseNumberText,
                            currentTable?.id_table === table.id_table &&
                              styles.phaseNumberTextActive,
                          ]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.tableOptionText,
                          currentTable?.id_table === table.id_table &&
                            styles.tableOptionTextActive,
                        ]}>
                        {table.table_name}
                      </Text>
                    </View>
                    {currentTable?.id_table === table.id_table && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#d44e00"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL CREAR TAREA */}
        <Modal transparent visible={modalTaskVisible} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <Ionicons name="create" size={26} color="#d44e00" />
                      <Text style={styles.modalTitle}>Nueva Tarea</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalTaskVisible(false)}
                      style={styles.closeButton}>
                      <Ionicons name="close-circle" size={28} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollContent}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        <Ionicons name="text" size={14} color="#d44e00" />{' '}
                        Título
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: Investigar metodología"
                        placeholderTextColor="#666"
                        value={newTaskTitle}
                        onChangeText={setNewTaskTitle}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        <Ionicons
                          name="document-text"
                          size={14}
                          color="#d44e00"
                        />{' '}
                        Descripción (opcional)
                      </Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Agrega detalles sobre esta tarea..."
                        multiline
                        placeholderTextColor="#666"
                        value={newTaskDescription}
                        onChangeText={setNewTaskDescription}
                        textAlignVertical="top"
                      />
                    </View>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="flag" size={14} color="#d44e00" /> Estado
                      inicial
                    </Text>
                    <View style={styles.statusContainer}>
                      {statuses.map((s) => (
                        <TouchableOpacity
                          key={s.id_status}
                          style={[
                            styles.statusBtn,
                            newTaskStatusId === s.id_status &&
                              styles.statusBtnActive,
                          ]}
                          onPress={() => setNewTaskStatusId(s.id_status)}
                          activeOpacity={0.3}>
                          <Text
                            style={[
                              styles.statusText,
                              newTaskStatusId === s.id_status &&
                                styles.statusTextActive,
                            ]}>
                            {s.status_name === 'To Do'
                              ? '🧠'
                              : s.status_name === 'Doing'
                              ? '⚙️'
                              : '🚀'}
                          </Text>
                          <Text
                            style={[
                              styles.statusText,
                              newTaskStatusId === s.id_status &&
                                styles.statusTextActive,
                            ]}>
                            {s.status_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* SECCIÓN DE ENCARGADOS (CREACIÓN) */}
                    <Text style={styles.inputLabel}>
                      <Ionicons name="people" size={14} color="#d44e00" />{' '}
                      Encargados ({selectedMembers.length})
                    </Text>
                    {Platform.OS !== 'android' ? (
                      <View style={styles.membersScrollViewContainer}>
                        <ScrollView
                          style={styles.membersScrollView}
                          showsVerticalScrollIndicator={true}>
                          {teamMembers.length === 0 ? (
                            <View style={styles.emptyMembers}>
                              <Text style={styles.emptyMembersText}>
                                No hay miembros en el equipo
                              </Text>
                            </View>
                          ) : (
                            teamMembers.map((member) => (
                              <TouchableOpacity
                                key={member.id_user}
                                style={[
                                  styles.memberItem,
                                  selectedMembers.includes(member.id_user) &&
                                    styles.memberItemActive,
                                ]}
                                onPress={() =>
                                  toggleMemberSelection(
                                    member.id_user,
                                    'create'
                                  )
                                }
                                activeOpacity={0.3}>
                                <View style={styles.memberInfo}>
                                  <View
                                    style={[
                                      styles.memberAvatar,
                                      selectedMembers.includes(
                                        member.id_user
                                      ) && styles.memberAvatarActive,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.memberAvatarText,
                                        selectedMembers.includes(
                                          member.id_user
                                        ) && styles.memberAvatarTextActive,
                                      ]}>
                                      {member.name.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View style={styles.memberDetails}>
                                    <Text
                                      style={[
                                        styles.memberName,
                                        selectedMembers.includes(
                                          member.id_user
                                        ) && styles.memberNameActive,
                                      ]}>
                                      {member.name}
                                    </Text>
                                    <Text style={styles.memberRole}>
                                      @{member.username}
                                    </Text>
                                  </View>
                                </View>
                                {selectedMembers.includes(member.id_user) && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#d44e00"
                                  />
                                )}
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    ) : teamMembers.length === 0 ? (
                      <View style={styles.emptyMembers}>
                        <Text style={styles.emptyMembersText}>
                          No hay miembros en el equipo
                        </Text>
                      </View>
                    ) : (
                      teamMembers.map((member) => (
                        <TouchableOpacity
                          key={member.id_user}
                          style={[
                            styles.memberButton,
                            selectedMembers.includes(member.id_user) &&
                              styles.memberButtonActive,
                          ]}
                          onPress={() =>
                            toggleMemberSelection(member.id_user, 'create')
                          }
                          activeOpacity={0.3}>
                          <View style={styles.memberInfo}>
                            <View
                              style={[
                                styles.memberAvatar,
                                selectedMembers.includes(member.id_user) &&
                                  styles.memberAvatarActive,
                              ]}>
                              <Text
                                style={[
                                  styles.memberAvatarText,
                                  selectedMembers.includes(member.id_user) &&
                                    styles.memberAvatarTextActive,
                                ]}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.memberDetails}>
                              <Text
                                style={[
                                  styles.memberName,
                                  selectedMembers.includes(member.id_user) &&
                                    styles.memberNameActive,
                                ]}>
                                {member.name}
                              </Text>
                              <Text style={styles.memberRole}>
                                @{member.username}
                              </Text>
                            </View>
                          </View>
                          {selectedMembers.includes(member.id_user) && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#fff"
                            />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleCreateTask}
                      activeOpacity={0.3}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#fff"
                      />
                      <Text style={styles.saveText}>Crear Tarea</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setModalTaskVisible(false)}
                      activeOpacity={0.3}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* NUEVO: MODAL EDITAR TAREA */}
        <Modal transparent visible={modalEditVisible} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <Ionicons name="create" size={26} color="#d44e00" />
                      <Text style={styles.modalTitle}>Editar Tarea</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalEditVisible(false)}
                      style={styles.closeButton}>
                      <Ionicons name="close-circle" size={28} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollContent}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        <Ionicons name="text" size={14} color="#d44e00" />{' '}
                        Título
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: Investigar metodología"
                        placeholderTextColor="#666"
                        value={editTaskTitle}
                        onChangeText={setEditTaskTitle}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        <Ionicons
                          name="document-text"
                          size={14}
                          color="#d44e00"
                        />{' '}
                        Descripción (opcional)
                      </Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Agrega detalles sobre esta tarea..."
                        multiline
                        placeholderTextColor="#666"
                        value={editTaskDescription}
                        onChangeText={setEditTaskDescription}
                        textAlignVertical="top"
                      />
                    </View>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="flag" size={14} color="#d44e00" /> Estado
                    </Text>
                    <View style={styles.statusContainer}>
                      {statuses.map((s) => (
                        <TouchableOpacity
                          key={s.id_status}
                          style={[
                            styles.statusBtn,
                            editTaskStatusId === s.id_status &&
                              styles.statusBtnActive,
                          ]}
                          onPress={() => setEditTaskStatusId(s.id_status)}
                          activeOpacity={0.3}>
                          <Text
                            style={[
                              styles.statusText,
                              editTaskStatusId === s.id_status &&
                                styles.statusTextActive,
                            ]}>
                            {s.status_name === 'To Do'
                              ? '🧠'
                              : s.status_name === 'Doing'
                              ? '⚙️'
                              : '🚀'}
                          </Text>
                          <Text
                            style={[
                              styles.statusText,
                              editTaskStatusId === s.id_status &&
                                styles.statusTextActive,
                            ]}>
                            {s.status_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* SECCIÓN DE ENCARGADOS (EDICIÓN) */}
                    <Text style={styles.inputLabel}>
                      <Ionicons name="people" size={14} color="#d44e00" />{' '}
                      Encargados ({editSelectedMembers.length})
                    </Text>
                    {Platform.OS !== 'android' ? (
                      <View style={styles.membersScrollViewContainer}>
                        <ScrollView
                          style={styles.membersScrollView}
                          showsVerticalScrollIndicator={true}>
                          {teamMembers.length === 0 ? (
                            <View style={styles.emptyMembers}>
                              <Text style={styles.emptyMembersText}>
                                No hay miembros en el equipo
                              </Text>
                            </View>
                          ) : (
                            teamMembers.map((member) => (
                              <TouchableOpacity
                                key={member.id_user}
                                style={[
                                  styles.memberItem,
                                  editSelectedMembers.includes(
                                    member.id_user
                                  ) && styles.memberItemActive,
                                ]}
                                onPress={() =>
                                  toggleMemberSelection(member.id_user, 'edit')
                                }
                                activeOpacity={0.3}>
                                <View style={styles.memberInfo}>
                                  <View
                                    style={[
                                      styles.memberAvatar,
                                      editSelectedMembers.includes(
                                        member.id_user
                                      ) && styles.memberAvatarActive,
                                    ]}>
                                    <Text
                                      style={[
                                        styles.memberAvatarText,
                                        editSelectedMembers.includes(
                                          member.id_user
                                        ) && styles.memberAvatarTextActive,
                                      ]}>
                                      {member.name.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View style={styles.memberDetails}>
                                    <Text
                                      style={[
                                        styles.memberName,
                                        editSelectedMembers.includes(
                                          member.id_user
                                        ) && styles.memberNameActive,
                                      ]}>
                                      {member.name}
                                    </Text>
                                    <Text style={styles.memberRole}>
                                      @{member.username}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    ) : teamMembers.length === 0 ? (
                      <View style={styles.emptyMembers}>
                        <Text style={styles.emptyMembersText}>
                          No hay miembros en el equipo
                        </Text>
                      </View>
                    ) : (
                      teamMembers.map((member) => (
                        <TouchableOpacity
                          key={member.id_user}
                          style={[
                            styles.memberButton,
                            editSelectedMembers.includes(member.id_user) &&
                              styles.memberButtonActive,
                          ]}
                          onPress={() =>
                            toggleMemberSelection(member.id_user, 'edit')
                          }
                          activeOpacity={0.3}>
                          <View style={styles.memberInfo}>
                            <View
                              style={[
                                styles.memberAvatar,
                                selectedMembers.includes(member.id_user) &&
                                  styles.memberAvatarActive,
                              ]}>
                              <Text
                                style={[
                                  styles.memberAvatarText,
                                  selectedMembers.includes(member.id_user) &&
                                    styles.memberAvatarTextActive,
                                ]}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.memberDetails}>
                              <Text
                                style={[
                                  styles.memberName,
                                  selectedMembers.includes(member.id_user) &&
                                    styles.memberNameActive,
                                ]}>
                                {member.name}
                              </Text>
                              <Text style={styles.memberRole}>
                                @{member.username}
                              </Text>
                            </View>
                          </View>
                          {selectedMembers.includes(member.id_user) && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#fff"
                            />
                          )}
                        </TouchableOpacity>
                      ))
                    )}

                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleUpdateTask}
                      activeOpacity={0.3}>
                      <Ionicons name="save" size={22} color="#fff" />
                      <Text style={styles.saveText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setModalEditVisible(false)}
                      activeOpacity={0.3}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
/* ================================ ESTILOS MEJORADOS =================================*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 20,
  },
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header mejorado
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  // Selector Section
  pickerSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  pickerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  selectorButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d44e00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  // Phase Indicator
  phaseIndicator: {
    marginTop: 12,
  },
  phaseBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  phaseSegment: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 1,
  },
  phaseSegmentActive: {
    backgroundColor: '#d44e00',
  },
  phaseText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Board Container
  boardContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  column: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  columnTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  badge: {
    backgroundColor: '#d44e00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Cards
  card: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#d44e00',
    // Efecto de sombra al hacer long press (Android)
    elevation: 3,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  detail: {
    color: '#AAAAAA',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  // Eliminados: taskButtons, iconBtn, iconBtnLeft, iconBtnRight

  // Nuevos estilos para asignados en la tarjeta
  assignedMembersContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d44e00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  miniAvatarMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // FAB
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
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  // Modal Selector de Tableros
  tablePickerModal: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopWidth: 3,
    borderTopColor: '#d44e00',
    maxHeight: '70%',
  },
  tablePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tablePickerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tableList: {
    paddingHorizontal: 24,
  },
  tableOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#252525',
  },
  tableOptionActive: {
    backgroundColor: '#2A1A10',
    borderColor: '#d44e00',
  },
  tableOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  phaseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseNumberActive: {
    backgroundColor: '#d44e00',
  },
  phaseNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#666',
  },
  phaseNumberTextActive: {
    color: '#FFFFFF',
  },
  tableOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#CCCCCC',
    flex: 1,
  },
  tableOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Modal Crear/Editar Tarea
  modalCard: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 0, // Quitamos paddingBottom aquí para controlarlo en contentContainerStyle
    borderTopWidth: 3,
    borderTopColor: '#d44e00',
    maxHeight: '90%', // Límite de altura para el modal
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 40, // Espacio al final del scrollview
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#d44e00',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#252525',
    alignItems: 'center',
    gap: 4,
  },
  statusBtnActive: {
    backgroundColor: '#d44e00',
    borderColor: '#d44e00',
  },
  statusText: {
    color: '#AAAAAA',
    fontWeight: '600',
    fontSize: 12,
  },
  statusTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d44e00',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#d44e00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 15,
  },
  // Members Section
  membersScrollViewContainer: {
    // Contenedor para limitar la altura de la lista de miembros
    maxHeight: 200,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1.5,
    borderColor: '#252525',
  },
  membersScrollView: {
    paddingVertical: 4, // Pequeño padding interno
  },
  emptyMembers: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMembersText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  memberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#252525',
    marginBottom: 8,
  },
  memberButtonActive: {
    backgroundColor: '#d44e00',
    borderColor: '#d44e00',
    borderWidth: 2,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    color: '#CCCCCC',
    fontSize: 15,
    fontWeight: '600',
  },
  memberNameActive: {
    color: '#fff',
    fontWeight: '700',
  },
  memberRole: {
    color: '#888',
    fontSize: 13,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarActive: {
    backgroundColor: '#e88f5a',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  memberAvatarTextActive: {
    color: '#d44e00',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#252525',
  },
  memberItemActive: {
    backgroundColor: '#2A1A10',
    borderColor: '#d44e00',
  },
});

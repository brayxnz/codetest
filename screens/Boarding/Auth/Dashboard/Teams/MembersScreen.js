// screens/Teams/MembersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {supabase} from '../../../../../CBD';
import AsyncStorage from '@react-native-async-storage/async-storage';

const navigation = useNavigation;
const ROLES = [
  'Product Owner',
  'Scrum Master',
  'Desarrollador',
  'Encargado de bitácora',
];

export default function MembersScreen({ route }) {
  const { teamId, rootNavigation} = route.params;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isProductOwner, setIsProductOwner] = useState(null);
  const [modalMemberVisible, setModalMemberVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [modalSelectRoleVisible, setModalSelectRoleVisible] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) loadMembers();
  }, [currentUserId]);
  // En MembersScreen.js
const loadCurrentUser = async () => {
  const userData = await AsyncStorage.getItem('userData');  // ✅ Cambiar 'user' a 'userData'
  if (userData) {
    const parsed = JSON.parse(userData);
    setCurrentUserId(parsed.id_user);
    console.log('📱 Usuario cargado:', parsed.id_user, typeof parsed.id_user);
  }
};

const loadMembers = async () => {
  setLoading(true);
  
  const { data, error } = await supabase
    .from('team_members')
    .select(
      `
      id_member,
      id_user,
      role,
      created_at,
      users (
        id_user,
        name,
        username
      )
    `
    )
    .eq('id_team', teamId)
    .order('created_at', { ascending: true });

  if (!error && data) {
    const formatted = data.map((item) => ({
      id_member: item.id_member,
      id_user: item.id_user,
      name: item.users?.name || 'Usuario',
      username: item.users?.username || 'sin_username',
      role: item.role || 'Desarrollador',
      created_at: item.created_at,
      isCurrentUser: item.id_user === currentUserId,
    }));

    setMembers(formatted);

    const myself = formatted.find((m) => m.id_user === currentUserId);
    
    // 🔥 VALIDACIÓN: Si no estás en el equipo
    if (!myself) {
      Alert.alert(
        'No eres miembro',
        'No perteneces a este equipo o fuiste eliminado',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      setLoading(false);
      return;
    }
    
    setIsProductOwner(myself.role === 'Product Owner');
  }
  setLoading(false);
};


  const handleLongPress = (member) => {
    setSelectedMember(member);
    setModalMemberVisible(true);
  };

  const handleRemoveMember = async () => {
    if (!isProductOwner)
      return Alert.alert(
        'Permiso denegado',
        'Solo el Product Owner puede eliminar miembros'
      );

    if (selectedMember.role === 'Product Owner')
      return Alert.alert('Error', 'No se puede eliminar al Product Owner');

    Alert.alert('Eliminar miembro', `¿Eliminar a ${selectedMember.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id_member', selectedMember.id_member);

          if (error) return Alert.alert('Error', error.message);

          Alert.alert('Éxito', 'Miembro eliminado');
          setModalMemberVisible(false);
          loadMembers();
        },
      },
    ]);
  };

  const openRoleSelector = (memberId) => {
    if (!isProductOwner)
      return Alert.alert(
        'Permiso denegado',
        'Solo el Product Owner puede asignar roles'
      );

    setEditingMemberId(memberId);
    setModalMemberVisible(false);
    setModalSelectRoleVisible(true);
  };

  const handleChangeRole = async (newRole) => {
    const member = members.find((m) => m.id_member === editingMemberId);

    if (member.role === 'Product Owner')
      return Alert.alert('Error', 'No puedes cambiar el rol del Product Owner');

    if (newRole === 'Product Owner')
      return Alert.alert('Error', 'Ya existe un Product Owner');

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id_member', editingMemberId);

    if (error) Alert.alert('Error', error.message);

    setModalSelectRoleVisible(false);
    setEditingMemberId(null);
    loadMembers();
  };

  const getRoleColor = (role) =>
    ({
      'Product Owner': '#d44e00',
      'Scrum Master': '#116b17',
      Desarrollador: '#223c8c',
      'Encargado de bitácora': '#3E6479',
    }[role] || '#888');

  const getRoleIcon = (role) =>
    ({
      'Product Owner': 'star',
      'Scrum Master': 'people',
      Desarrollador: 'code-slash',
      'Encargado de bitácora': 'book',
    }[role] || 'person');
    
const canManageMembers = (member) => {
  return isProductOwner && member.role !== 'Product Owner';
};


 // 🔥 NUEVA: Salir del equipo// 🔥 Salir del equipo
const handleLeaveTeam = async () => {
  Alert.alert('Salir del equipo', '¿Estás seguro de que quieres salir?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Salir',
      style: 'destructive',
      onPress: async () => {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id_team', teamId)
          .eq('id_user', currentUserId);

        if (error) {
          return Alert.alert('Error', error.message);
        }

        Alert.alert('Éxito', 'Has salido del equipo', [
          {
            text: 'OK',
            onPress: () => {
              rootNavigation?.navigate('HomeTabs');            },
          },
        ]);
      },
    },
  ]);
};

// 🔥 Eliminar equipo (solo Product Owner)
const handleDeleteTeam = async () => {
  Alert.alert(
    'Eliminar equipo',
    '¿Estás seguro? Esta acción no se puede deshacer.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id_team', teamId);

          if (error) {
            return Alert.alert('Error', error.message);
          }

          Alert.alert('Éxito', 'El equipo ha sido eliminado', [
            {
              text: 'OK',
              onPress: () => {
                rootNavigation?.navigate('HomeTabs');              },
            },
          ]);
        },
      },
    ]
  );
};

  // 🔹 FOOTER: Botones de acción del equipo
  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <View style={styles.footerDivider} />

      {/* Botón: Salir del equipo (todos excepto PO) */}
      {!isProductOwner && (
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveTeam}>
          <Ionicons name="log-out-outline" size={22} color="#FF4444" />
          <Text style={styles.leaveButtonText}>Salir del equipo</Text>
        </TouchableOpacity>
      )}

      {/* Botón: Eliminar equipo (solo PO) */}
      {isProductOwner && (
        <TouchableOpacity
          style={styles.deleteTeamButton}
          onPress={handleDeleteTeam}>
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
          <Text style={styles.deleteTeamButtonText}>Eliminar equipo</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footerNote}>
        {isProductOwner
          ? 'Como Product Owner, puedes eliminar el equipo completo'
          : 'Puedes abandonar este equipo en cualquier momento'}
      </Text>
    </View>
  );
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#d44e00" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Ionicons name="people" size={28} color="#d44e00" />
          <View>
            <Text style={styles.title}>Miembros</Text>
            <Text style={styles.subtitle}>
              {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
            </Text>
          </View>
        </View>

        {/* 🔹 Mostrar rol del usuario actual con color */}
        {members.find((m) => m.isCurrentUser) && (
          <View
            style={{
              backgroundColor: getRoleColor(
                members.find((m) => m.isCurrentUser).role
              ),
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 10,
              alignSelf: 'flex-start',
              marginTop: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {members.find((m) => m.isCurrentUser).role}
            </Text>
          </View>
        )}
      </View>

      {/* LISTA */}
      <FlatList
        data={members}
        keyExtractor={(i) => i.id_member.toString()}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
           <TouchableOpacity
           style={[
          styles.memberCard,
          item.isCurrentUser && styles.memberCardCurrent,
          item.isCurrentUser && { borderColor: getRoleColor(item.role) },
          item.role === 'Product Owner' && styles.memberCardPO,
          ]}
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.7}>
            <View style={styles.memberLeft}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: getRoleColor(item.role) + '33' },
                ]}>
                <Text
                  style={[
                    styles.avatarText,
                    { color: getRoleColor(item.role) },
                  ]}>
                  {item.name[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{item.name}</Text>

                  {item.isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>TÚ</Text>
                    </View>
                  )}

                  {item.role === 'Product Owner' && (
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color="#d44e00"
                    />
                  )}
                </View>

                <Text style={styles.memberUsername}>@{item.username}</Text>
              </View>
            </View>

            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(item.role) },
              ]}>
              <Ionicons name={getRoleIcon(item.role)} size={18} color="white" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* MODAL DE DETALLES DEL MIEMBRO */}
      <Modal
        transparent
        visible={modalMemberVisible}
        animationType="fade"
        onRequestClose={() => setModalMemberVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalMemberVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.memberDetailModal}>
                <View style={styles.modalHeader}>
                  <Ionicons name="person-circle" size={32} color="#d44e00" />
                  <TouchableOpacity
                    onPress={() => setModalMemberVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#666" />
                  </TouchableOpacity>
                </View>

                {selectedMember && (
                  <>
                    <View style={styles.memberDetailContent}>
                      <View
                        style={[
                          styles.avatarLarge,
                          {
                            backgroundColor: getRoleColor(selectedMember.role),
                          },
                        ]}>
                        <Text style={styles.avatarLargeText}>
                          {selectedMember.name[0].toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.memberDetailName}>
                        {selectedMember.name}
                      </Text>
                      <Text style={styles.memberDetailUsername}>
                        @{selectedMember.username}
                      </Text>

                      <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#888" />
                        <Text style={styles.infoText}>
                          Miembro desde{' '}
                          {new Date(
                            selectedMember.created_at
                          ).toLocaleDateString()}
                        </Text>
                      </View>

                      <Text style={styles.currentRoleLabel}>Rol actual</Text>
                      <View
                        style={[
                          styles.currentRoleBadge,
                          {
                            backgroundColor: getRoleColor(selectedMember.role),
                          },
                        ]}>
                        <Ionicons
                          name={getRoleIcon(selectedMember.role)}
                          size={18}
                          color="white"
                        />
                        <Text style={styles.currentRoleText}>
                          {selectedMember.role}
                        </Text>
                      </View>
                    </View>

                    {canManageMembers(selectedMember) ? (
                      <View>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() =>
                            openRoleSelector(selectedMember.id_member)
                          }>
                          <Ionicons name="create" size={20} color="#d44e00" />
                          <Text style={styles.actionButtonText}>
                            Cambiar Rol
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.actionButtonDanger,
                          ]}
                          onPress={handleRemoveMember}>
                          <Ionicons name="trash" size={20} color="#FF4444" />
                          <Text
                            style={[
                              styles.actionButtonText,
                              styles.actionButtonTextDanger,
                            ]}>
                            Eliminar del Equipo
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.permissionNote}>
                        <Ionicons name="lock-closed" size={16} color="#888" />
                        <Text style={styles.permissionNoteText}>
                          Solo el Product Owner puede gestionar miembros
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL DE ROLES — AHORA SON BOTONES */}
      <Modal
        transparent
        visible={modalSelectRoleVisible}
        animationType="slide"
        onRequestClose={() => setModalSelectRoleVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rolePickerModal}>
            <View style={styles.rolePickerHeader}>
              <Text style={styles.rolePickerTitle}>Selecciona un Rol</Text>
              <TouchableOpacity
                onPress={() => setModalSelectRoleVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {ROLES.filter((r) => r !== 'Product Owner').map((role, index) => (
              <TouchableOpacity
                key={index}
                style={styles.roleButton}
                onPress={() => handleChangeRole(role)}>
                <Ionicons
                  name={getRoleIcon(role)}
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.roleButtonText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#888' },

  listContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 90 },

  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  memberCardCurrent: { borderWidth: 2 },
  memberCardPO: {
    borderColor: '#d44e00',
    borderWidth: 2,
    backgroundColor: '#1A0F0A',
  },

  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },

  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  memberName: { fontSize: 16, color: '#fff', fontWeight: '700' },
  youBadge: {
    backgroundColor: '#d44e00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },

  memberUsername: { fontSize: 13, color: '#888' },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: { color: 'white', fontSize: 12, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  memberDetailModal: {
    backgroundColor: '#141414',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d44e00',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  memberDetailContent: { alignItems: 'center', marginBottom: 24 },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: { fontSize: 36, fontWeight: '800', color: 'white' },

  memberDetailName: { fontSize: 24, color: '#fff', fontWeight: '800' },
  memberDetailUsername: { fontSize: 16, color: '#888' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  infoText: { color: '#888', fontSize: 13 },

  currentRoleLabel: { color: '#888', marginTop: 20, fontSize: 12 },
  currentRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  currentRoleText: { color: 'white', fontSize: 16, fontWeight: '700' },

  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d44e00',
    marginBottom: 12,
  },
  actionButtonDanger: { borderColor: '#FF4444' },
  actionButtonText: { color: '#d44e00', fontSize: 15, fontWeight: '700' },
  actionButtonTextDanger: { color: '#FF4444' },

  permissionNote: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  permissionNoteText: { color: '#888', fontStyle: 'italic' },

  rolePickerModal: {
    width: '100%',
    backgroundColor: '#141414',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d44e00',
  },
  rolePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 20,
  },
  rolePickerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },

  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  roleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // 🔥 NUEVOS ESTILOS PARA FOOTER
  footerContainer: {
    marginTop: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1A1A1A',
    marginBottom: 20,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF4444',
    width: '100%',
    justifyContent: 'center',
  },
  leaveButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#DC2626',
    width: '100%',
    justifyContent: 'center',
  },
  deleteTeamButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

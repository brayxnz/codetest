import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState('');
  const [nombre, setNombre] = useState('Usuario');
  const [password, setPassword] = useState('');

  // Estados para modales
  const [showDataModal, setShowDataModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Estados para mostrar/ocultar contraseña en modal de datos
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // Estados para cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');

      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        setUserId(userData.id_user?.toString() || '');
        setUser(userData.username || '');
        setNombre(userData.name || 'Usuario');
        setPassword(userData.password || '');
      }
    } catch (error) {
      console.log('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
    }
  };

  const loadPasswordFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('id_user', userId)
        .single();

      if (data && !error) {
        setPassword(data.password);
      }
    } catch (error) {
      console.log('Error al cargar contraseña:', error);
    }
  };

  const handleShowDataModal = async () => {
    setShowDataModal(true);
    await loadPasswordFromDB();
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Verifica la contraseña actual
      const { data: userData, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id_user', userId)
        .eq('password', currentPassword)
        .single();

      if (verifyError || !userData) {
        Alert.alert('Error', 'La contraseña actual es incorrecta');
        setLoading(false);
        return;
      }

      // Actualiza la contraseña
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id_user', userId);

      if (updateError) {
        Alert.alert('Error', 'No se pudo actualizar la contraseña');
        setLoading(false);
        return;
      }

      // Actualiza el AsyncStorage
      const savedUserData = await AsyncStorage.getItem('userData');
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        userData.password = newPassword;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }

      Alert.alert('Éxito', 'Contraseña actualizada correctamente');

      // Limpia los campos y cierra el modal
      setCurrentPassword('');
      setNewPassword('');
      setPassword(newPassword);
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', 'Ocurrió un error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };
// En SettingsScreen.js - función logout
const logout = async () => {
  if (Platform.OS === 'web') {
    const confirmLogout = window.confirm('¿Deseas salir de CodeNest?');

    if (confirmLogout) {
      try {
        // 🔥 Elimina ambas keys para estar seguro
        await AsyncStorage.multiRemove(['userData', 'user']);
        console.log('Sesión cerrada correctamente');

        navigation.reset({
          index: 0,
          routes: [{ name: 'PLogin' }],
        });
      } catch (error) {
        console.log('Error al cerrar sesión:', error);
        window.alert('Error: No se pudo cerrar sesión correctamente');
      }
    }
    return;
  }

  Alert.alert('Cerrar sesión', '¿Deseas salir de CodeNest?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Salir',
      onPress: async () => {
        try {
          // 🔥 Elimina ambas keys para estar seguro
          await AsyncStorage.multiRemove(['userData', 'user']);
          console.log('Sesión cerrada correctamente');

          navigation.reset({
            index: 0,
            routes: [{ name: 'PLogin' }],
          });
        } catch (error) {
          console.log('Error al cerrar sesión:', error);
          Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
        }
      },
    },
  ]);
};

  function abrirWeb(op) {
    switch (op) {
      case 1:
        Linking.openURL('https://fransalcido08.github.io/codenest-app/');
        break;
      case 2:
        Linking.openURL(
          'https://fransalcido08.github.io/codenest-app/soporte.html'
        );
        break;
      default:
        return;
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0a0a0a', paddingTop: 40 }}>
      <Text style={styles.header}>Ajustes</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={80} color="#d44e00" />
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.user}>@{user}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
            onPress={handleShowDataModal}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#d44e00"
            />
            <Text style={styles.optionText}>Tus datos</Text>
          </TouchableOpacity>
          {/*<TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Cambiar contraseña</Text>
          </TouchableOpacity>*/}
        </View>

        <View style={styles.section}>
        <View style={{flexDirection: 'row',
}}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        </View>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => abrirWeb(1)}>
            <Ionicons name="help-circle-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Centro de información</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 10,
            }} onPress={() => abrirWeb(2)}>
            <Ionicons name="chatbubbles-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color='#DC2626'/>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>CodeNest v1.0.1</Text>
      </ScrollView>

      {/* Modal para mostrar datos del usuario */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDataModal}
        onRequestClose={() => {
          setShowDataModal(false);
          setShowPasswordInModal(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tus Datos</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDataModal(false);
                  setShowPasswordInModal(false);
                }}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="person-outline" size={20} color="#d44e00" />
              <View style={styles.dataInfo}>
                <Text style={styles.dataLabel}>Nombre</Text>
                <Text style={styles.dataValue}>{nombre}</Text>
              </View>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="at-outline" size={20} color="#d44e00" />
              <View style={styles.dataInfo}>
                <Text style={styles.dataLabel}>Usuario</Text>
                <Text style={styles.dataValue}>@{user}</Text>
              </View>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#d44e00" />
              <View style={styles.dataInfo}>
                <Text style={styles.dataLabel}>Contraseña</Text>
                <View style={styles.passwordRow}>
                  <Text style={styles.dataValue}>
                    {showPasswordInModal ? password : '••••••••'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPasswordInModal(!showPasswordInModal)}
                    style={styles.eyeIcon}>
                    <Ionicons
                      name={
                        showPasswordInModal ? 'eye-off-outline' : 'eye-outline'
                      }
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setShowDataModal(false);
                setShowPasswordInModal(false);
              }}>
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para cambiar contraseña 
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
              }}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña actual"
              placeholderTextColor="#666"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable={!loading}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              placeholderTextColor="#666"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, loading && styles.modalSaveBtnDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
              }}
              disabled={loading}
            >
              <Text style={styles.modalCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>*/}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#0a0a0a',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    marginLeft: '6%',
    color: 'white',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#141414',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { marginBottom: 10 },
  userName: { fontSize: 20, fontWeight: '700', color: 'lightgray' },
  user: { color: '#6B7280', marginBottom: 10 },
  section: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 16,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#474747',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
    color: 'white',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#DC2626',
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 12,
  },
  // Estilos para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  dataInfo: {
    marginLeft: 15,
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyeIcon: {
    padding: 5,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    marginBottom: 15,
    fontSize: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#d44e00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#474747',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelBtnText: {
    color: 'white',
    fontSize: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#d44e00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Datos simulados (reemplazar con queries a Supabase) ──────────────────────
const MOCK_USER_COSMETICS = [
  // Marcos
  { id: 1, nombre: 'Marco Dorado',    categoria: 'marco',    equipado: false, icono: 'medal-outline',         color: '#FFD700' },
  { id: 2, nombre: 'Marco Plateado',  categoria: 'marco',    equipado: false, icono: 'medal-outline',         color: '#C0C0C0' },
  { id: 3, nombre: 'Marco Diamante',  categoria: 'marco',    equipado: true,  icono: 'diamond-outline',       color: '#b9f2ff' },
  { id: 4, nombre: 'Marco Fuego',     categoria: 'marco',    equipado: false, icono: 'flame-outline',         color: '#FF6B35' },
  // Colores
  { id: 5, nombre: 'Rojo Intenso',    categoria: 'color',    equipado: true,  icono: 'color-palette-outline', color: '#E63946' },
  { id: 6, nombre: 'Azul Océano',     categoria: 'color',    equipado: false, icono: 'color-palette-outline', color: '#457B9D' },
  { id: 7, nombre: 'Verde Neón',      categoria: 'color',    equipado: false, icono: 'color-palette-outline', color: '#06D6A0' },
  // Insignias
  { id: 8,  nombre: 'Insignia MVP',     categoria: 'insignia', equipado: false, icono: 'ribbon-outline',  color: '#d44e00' },
  { id: 9,  nombre: 'Insignia Pro',     categoria: 'insignia', equipado: true,  icono: 'star-outline',    color: '#FFD700' },
  { id: 10, nombre: 'Insignia Leyenda', categoria: 'insignia', equipado: false, icono: 'trophy-outline',  color: '#9B5DE5' },
  // Efectos
  { id: 11, nombre: 'Aura Mística',   categoria: 'efecto', equipado: false, icono: 'sparkles-outline', color: '#9B5DE5' },
  { id: 12, nombre: 'Destello Solar', categoria: 'efecto', equipado: false, icono: 'sunny-outline',    color: '#F4D03F' },
];

const CATEGORIAS = [
  { id: 'todos',    label: 'Todos',     icono: 'apps-outline'            },
  { id: 'marco',    label: 'Marcos',    icono: 'medal-outline'           },
  { id: 'color',    label: 'Colores',   icono: 'color-palette-outline'   },
  { id: 'insignia', label: 'Insignias', icono: 'ribbon-outline'          },
  { id: 'efecto',   label: 'Efectos',   icono: 'sparkles-outline'        },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const [userId, setUserId]   = useState('');
  const [user, setUser]       = useState('');
  const [nombre, setNombre]   = useState('Usuario');
  const [password, setPassword] = useState('');

  // Modales
  const [showDataModal,       setShowDataModal]       = useState(false);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [showCosmeticsModal,  setShowCosmeticsModal]  = useState(false);

  // Cosméticos
  const [cosmeticos,        setCosmeticos]        = useState([]);
  const [categoriaActiva,   setCategoriaActiva]   = useState('todos');
  const [loadingCosmeticos, setLoadingCosmeticos] = useState(false);

  // Datos
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [currentPassword,     setCurrentPassword]     = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [loading,             setLoading]             = useState(false);

  useEffect(() => { loadUserData(); }, []);

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

  // ─── Cosméticos ──────────────────────────────────────────────────────────────

  /**
   * Simula: SELECT c.*, uc.equipado FROM cosmeticos c
   *         JOIN usuario_cosmeticos uc ON c.id = uc.id_cosmetico
   *         WHERE uc.id_user = userId
   *
   * Supabase real:
   * const { data, error } = await supabase
   *   .from('usuario_cosmeticos')
   *   .select('cosmeticos(*), equipado')
   *   .eq('id_user', userId);
   */
  const fetchUserCosmeticos = async () => {
    setLoadingCosmeticos(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600)); // simula latencia
      setCosmeticos(MOCK_USER_COSMETICS);
    } catch (error) {
      console.log('Error al cargar cosméticos:', error);
      Alert.alert('Error', 'No se pudieron cargar los cosméticos');
    } finally {
      setLoadingCosmeticos(false);
    }
  };

  const handleOpenCosmeticsModal = async () => {
    setShowCosmeticsModal(true);
    setCategoriaActiva('todos');
    await fetchUserCosmeticos();
  };

  /**
   * Simula: UPDATE usuario_cosmeticos
   *         SET equipado = CASE WHEN id_cosmetico = :id THEN true ELSE false END
   *         WHERE id_user = :userId AND categoria = :categoria
   *
   * Supabase real (dos pasos):
   * await supabase.from('usuario_cosmeticos')
   *   .update({ equipado: false })
   *   .eq('id_user', userId)
   *   .eq('categoria', cosmetico.categoria);   // desequipa categoría
   * await supabase.from('usuario_cosmeticos')
   *   .update({ equipado: true })
   *   .eq('id_user', userId)
   *   .eq('id_cosmetico', cosmetico.id);       // equipa el seleccionado
   */
  const handleEquiparCosmetico = (cosmetico) => {
    setCosmeticos(prev =>
      prev.map(c => ({
        ...c,
        equipado: c.categoria === cosmetico.categoria
          ? c.id === cosmetico.id   // solo uno activo por categoría
          : c.equipado,
      }))
    );
    Alert.alert('¡Equipado!', `${cosmetico.nombre} ha sido equipado correctamente.`);
  };

  const cosmeticosFiltrados = categoriaActiva === 'todos'
    ? cosmeticos
    : cosmeticos.filter(c => c.categoria === categoriaActiva);

  // ─── Datos ───────────────────────────────────────────────────────────────────

  const loadPasswordFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('id_user', userId)
        .single();
      if (data && !error) setPassword(data.password);
    } catch (error) {
      console.log('Error al cargar contraseña:', error);
    }
  };

  const handleShowDataModal = async () => {
    setShowDataModal(true);
    await loadPasswordFromDB();
  };

  const handleChangePassword = async () => {
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
      const { data: userData, error: verifyError } = await supabase
        .from('users').select('*')
        .eq('id_user', userId).eq('password', currentPassword).single();

      if (verifyError || !userData) {
        Alert.alert('Error', 'La contraseña actual es incorrecta');
        setLoading(false);
        return;
      }
      const { error: updateError } = await supabase
        .from('users').update({ password: newPassword }).eq('id_user', userId);

      if (updateError) {
        Alert.alert('Error', 'No se pudo actualizar la contraseña');
        setLoading(false);
        return;
      }
      const savedUserData = await AsyncStorage.getItem('userData');
      if (savedUserData) {
        const ud = JSON.parse(savedUserData);
        ud.password = newPassword;
        await AsyncStorage.setItem('userData', JSON.stringify(ud));
      }
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setCurrentPassword(''); setNewPassword('');
      setPassword(newPassword); setShowPasswordModal(false);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas salir de CodeNest?')) {
        try {
          await AsyncStorage.multiRemove(['userData', 'user']);
          navigation.reset({ index: 0, routes: [{ name: 'PLogin' }] });
        } catch { window.alert('Error: No se pudo cerrar sesión correctamente'); }
      }
      return;
    }
    Alert.alert('Cerrar sesión', '¿Deseas salir de CodeNest?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['userData', 'user']);
            navigation.reset({ index: 0, routes: [{ name: 'PLogin' }] });
          } catch { Alert.alert('Error', 'No se pudo cerrar sesión correctamente'); }
        },
      },
    ]);
  };

  function abrirWeb(op) {
    switch (op) {
      case 1: Linking.openURL('https://fransalcido08.github.io/codenest-app/'); break;
      case 2: Linking.openURL('https://fransalcido08.github.io/codenest-app/soporte.html'); break;
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderCosmeticoItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cosmeticoCard, item.equipado && styles.cosmeticoCardEquipado]}
      onPress={() => handleEquiparCosmetico(item)}
      activeOpacity={0.75}
    >
      {item.equipado && (
        <View style={styles.equipadoBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#0a0a0a" />
        </View>
      )}
      <View style={[styles.cosmeticoIconContainer, { backgroundColor: item.color + '22' }]}>
        <Ionicons name={item.icono} size={30} color={item.color} />
      </View>
      <Text style={[styles.cosmeticoNombre, item.equipado && styles.cosmeticoNombreEquipado]}
            numberOfLines={2}>
        {item.nombre}
      </Text>
      <Text style={styles.cosmeticoCat}>{item.categoria}</Text>
    </TouchableOpacity>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', paddingTop: 40 }}>
      <Text style={styles.header}>Ajustes</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>

        {/* ── Perfil ───────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={80} color="#d44e00" />
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.user}>@{user}</Text>

          <TouchableOpacity style={styles.cosmeticsBtn} onPress={handleOpenCosmeticsModal}>
            <Ionicons name="brush-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Tus cosméticos</Text>
            <Ionicons name="chevron-forward-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ── Cuenta ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 }}
            onPress={handleShowDataModal}
          >
            <Ionicons name="information-circle-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Tus datos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Soporte ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.sectionTitle}>Soporte</Text>
          </View>
          <TouchableOpacity style={styles.optionRow} onPress={() => abrirWeb(1)}>
            <Ionicons name="help-circle-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Centro de información</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 }}
            onPress={() => abrirWeb(2)}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#d44e00" />
            <Text style={styles.optionText}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>CodeNest v1.0.1</Text>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════
          MODAL — Cosméticos
      ════════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCosmeticsModal}
        onRequestClose={() => setShowCosmeticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.cosmeticsModalContent]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tus Cosméticos</Text>
                <Text style={styles.modalSubtitle}>{cosmeticos.length} cosméticos adquiridos</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCosmeticsModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Chips de categoría */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriasScroll}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoriaChip, categoriaActiva === cat.id && styles.categoriaChipActiva]}
                  onPress={() => setCategoriaActiva(cat.id)}
                >
                  <Ionicons
                    name={cat.icono}
                    size={14}
                    color={categoriaActiva === cat.id ? '#0a0a0a' : '#9CA3AF'}
                  />
                  <Text style={[styles.categoriaChipText, categoriaActiva === cat.id && styles.categoriaChipTextActiva]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grid */}
            {loadingCosmeticos ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d44e00" />
                <Text style={styles.loadingText}>Cargando cosméticos...</Text>
              </View>
            ) : cosmeticosFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="gift-outline" size={48} color="#474747" />
                <Text style={styles.emptyText}>No tienes cosméticos en esta categoría</Text>
              </View>
            ) : (
              <FlatList
                data={cosmeticosFiltrados}
                keyExtractor={item => item.id.toString()}
                renderItem={renderCosmeticoItem}
                numColumns={3}
                columnWrapperStyle={styles.cosmeticsGrid}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              />
            )}

            {/* Nota */}
            <View style={styles.cosmeticsNote}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.cosmeticsNoteText}>
                Toca un cosmétioco para equiparlo en tu perfil
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════
          MODAL — Tus datos
      ════════════════════════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDataModal}
        onRequestClose={() => { setShowDataModal(false); setShowPasswordInModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tus Datos</Text>
              <TouchableOpacity onPress={() => { setShowDataModal(false); setShowPasswordInModal(false); }}>
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
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPasswordInModal ? 'eye-off-outline' : 'eye-outline'}
                      size={20} color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => { setShowDataModal(false); setShowPasswordInModal(false); }}
            >
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    fontSize: 24, fontWeight: 'bold',
    marginBottom: 20, marginTop: 30, marginLeft: '6%', color: 'white',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#141414',
    margin: 16, padding: 20, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
  },
  avatar: { marginBottom: 10 },
  userName: { fontSize: 20, fontWeight: '700', color: 'lightgray' },
  user: { color: '#6B7280', marginBottom: 10 },
  cosmeticsBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#1e1e1e', borderRadius: 10, marginTop: 4,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  section: {
    backgroundColor: '#141414', marginHorizontal: 16,
    marginVertical: 8, borderRadius: 12, paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: 'white',
    marginLeft: 16, marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: '#474747',
  },
  optionText: { flex: 1, fontSize: 15, marginLeft: 12, color: 'white' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10,
    backgroundColor: '#1A1A1A', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 14, borderWidth: 2, borderColor: '#DC2626',
    width: '90%', alignSelf: 'center', justifyContent: 'center',
  },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
  versionText: { textAlign: 'center', marginTop: 10, color: '#9CA3AF', fontSize: 12 },

  // ── Modales ───
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, width: '100%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // ── Cosméticos ───
  cosmeticsModalContent: {
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  categoriasScroll: { marginBottom: 14 },
  categoriaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#2a2a2a', marginRight: 8,
    borderWidth: 1, borderColor: '#3a3a3a',
  },
  categoriaChipActiva: { backgroundColor: '#d44e00', borderColor: '#d44e00' },
  categoriaChipText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  categoriaChipTextActiva: { color: '#0a0a0a', fontWeight: '700' },
  cosmeticsGrid: { justifyContent: 'flex-start', gap: 10, paddingHorizontal: 2, marginBottom: 10 },
  cosmeticoCard: {
    flex: 1, maxWidth: '31%',
    backgroundColor: '#1e1e1e', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#2a2a2a',
    position: 'relative', minHeight: 100, justifyContent: 'center',
  },
  cosmeticoCardEquipado: { borderColor: '#d44e00', backgroundColor: '#1e1208' },
  equipadoBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#d44e00', borderRadius: 10, padding: 1,
  },
  cosmeticoIconContainer: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginBottom: 7,
  },
  cosmeticoNombre: {
    fontSize: 11, color: '#9CA3AF', textAlign: 'center',
    fontWeight: '500', lineHeight: 14,
  },
  cosmeticoNombreEquipado: { color: '#d44e00', fontWeight: '700' },
  cosmeticoCat: { fontSize: 10, color: '#474747', marginTop: 2, textTransform: 'capitalize' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#474747', fontSize: 14, textAlign: 'center', maxWidth: 200 },
  cosmeticsNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2a2a2a', marginTop: 4,
  },
  cosmeticsNoteText: { fontSize: 12, color: '#6B7280', flex: 1 },

  // ── Datos ───
  dataRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2a2a2a', padding: 15, borderRadius: 10, marginBottom: 12,
  },
  dataInfo: { marginLeft: 15, flex: 1 },
  dataLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  dataValue: { fontSize: 16, color: 'white', fontWeight: '600' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyeIcon: { padding: 5 },
  modalCloseBtn: {
    backgroundColor: '#d44e00', borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 20,
  },
  modalCloseBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
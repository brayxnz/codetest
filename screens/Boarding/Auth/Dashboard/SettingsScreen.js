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
    import { FontAwesome5 } from '@expo/vector-icons';
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import { supabase } from '../../../../CBD';
    // ─────────────────────────────────────────────────────────────────────────────
    
    export default function SettingsScreen({ navigation }) {
      const [userId, setUserId]   = useState('');
      const [user, setUser]       = useState('');
      const [nombre, setNombre]   = useState('Usuario');
      const [password, setPassword] = useState('');
      const [equippedBadge, setEquippedBadge] = useState(null);
      // Modales
      const [showDataModal,       setShowDataModal]       = useState(false);
      const [showPasswordModal,   setShowPasswordModal]   = useState(false);
      const [showCosmeticsModal,  setShowCosmeticsModal]  = useState(false);
      
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
      // ─── Cosméticos (insignias) ───────────────────────────────────────────────────

const [insignias, setInsignias] = useState([]);
const [loadingInsignias, setLoadingInsignias] = useState(false);
const fetchEquippedBadge = async () => {
  if (!userId) return;

  try {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('equipped_badge_id, badges_shop!equipped_badge_id (icon_family, icon_name)')
      .eq('id_user', userId)
      .single();

    if (error) {
      console.log('Error fetchEquippedBadge:', error);
      return;
    }

    const badge = userRow.badges_shop; // puede ser null

    if (!badge) {
      setEquippedBadge(null);
      return;
    }

    setEquippedBadge({
      id: userRow.equipped_badge_id,
      icon_family: badge.icon_family,
      icon_name: badge.icon_name,
      color: '#FACC15',
    });
  } catch (e) {
    console.log('Error fetchEquippedBadge:', e);
  }
};
const fetchUserInsignias = async () => {
  if (!userId) return;
 
  setLoadingInsignias(true);
  try {
    // 1) Traer insignias del usuario
    const { data, error } = await supabase
      .from('user_badges_shop')
      .select('badge_id, badges_shop(*)')
      .eq('user_id', userId);

    if (error) {
      console.log('Error cargando user_badges_shop:', error);
      Alert.alert('Error', 'No se pudieron cargar tus insignias.');
      setLoadingInsignias(false);
      return;
    }

    const rows = data || [];
    const badges = rows
      .map((row) => row.badges_shop)
      .filter(Boolean);

    // 2) Saber cuál está equipada
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('equipped_badge_id')
      .eq('id_user', userId)
      .single();

    if (userError) {
      console.log('Error cargando equipped_badge_id:', userError);
    }

    const equippedId = userRow?.equipped_badge_id || null;

    setInsignias(
      badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon_family: b.icon_family,
        icon_name: b.icon_name,
        color: '#FACC15', // color del icono
        equipado: b.id === equippedId,
      }))
    );
  } catch (error) {
    console.log('Error fetchUserInsignias:', error);
    Alert.alert('Error', 'No se pudieron cargar tus insignias.');
  } finally {
    setLoadingInsignias(false);
  }
};

const handleOpenCosmeticsModal = async () => {
  setShowCosmeticsModal(true);
  await fetchUserInsignias();
};  
    
    
    const handleEquipInsignia = async (badge) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ equipped_badge_id: badge.id })
      .eq('id_user', userId);

    if (error) {
      console.log('Error equipando insignia:', error);
      Alert.alert('Error', 'No se pudo equipar la insignia.');
      return;
    }

    setInsignias((prev) =>
      prev.map((b) => ({
        ...b,
        equipado: b.id === badge.id,
      }))
    );
    setEquippedBadge({
      id: badge.id,
      icon_family: badge.icon_family,
      icon_name: badge.icon_name,
      color: badge.color,
    });

    Alert.alert('¡Equipada!', `"${badge.name}" se mostrará junto a tu nombre.`);
  } catch (error) {
    console.log('Error handleEquipInsignia:', error);
    Alert.alert('Error', 'Ocurrió un problema al equipar la insignia.');
  }
};
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
    onPress={() => handleEquipInsignia(item)}
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
    </View><View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text style={styles.userName}>{nombre}</Text>
  {equippedBadge && (
    <View style={{ marginLeft: 6 }}>
      {equippedBadge.icon_family === 'Ionicons' ? (
        <Ionicons
          name={equippedBadge.icon_name}
          size={18}
          color={equippedBadge.color}
        />
      ) : (
        <FontAwesome5
          name={equippedBadge.icon_name}
          size={16}
          color={equippedBadge.color}
        />
      )}
    </View>
  )}
</View>

<Text style={styles.user}>@{user}</Text>  
    
    <TouchableOpacity style={styles.cosmeticsBtn} onPress={handleOpenCosmeticsModal}>
    <Ionicons name="brush-outline" size={20} color="#d44e00" />
    <Text style={styles.optionText}>Tus cosméticos</Text>
    <Ionicons name="chevron-forward-outline" size={16} color="#6B7280" />
    </TouchableOpacity>
    </View>
    
    {/* ── Cuenta ───────────────────────────────────────────── */}
    {/* ── Cuenta ───────────────────────────────────────────── */}
    <View style={styles.section}>
    <Text style={styles.sectionTitle}>Cuenta</Text>
    
    {/* Tus datos */}
    <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: '#474747',
    }}
    onPress={handleShowDataModal}
    >
    <Ionicons name="information-circle-outline" size={20} color="#d44e00" />
    <Text style={styles.optionText}>Tus datos</Text>
    </TouchableOpacity>
    
    {/* Tienda de insignias */}
    <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    }}
    onPress={() => navigation.navigate('BadgesShop', { userId })}  > 
    <Ionicons name="storefront" size={20} color="#d44e00" />
    <Text style={styles.optionText}>Tienda de insignias</Text>
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
    {/* MODAL — Insignias equipables */}
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
    <Text style={styles.modalTitle}>Tus insignias</Text>
    <Text style={styles.modalSubtitle}>
    {insignias.length} insignia(s) en tu colección
    </Text>
    </View>
    <TouchableOpacity onPress={() => setShowCosmeticsModal(false)}>
    <Ionicons name="close" size={24} color="white" />
    </TouchableOpacity>
    </View>
    
    {/* Grid de insignias */}
    {loadingInsignias ? (
      <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#d44e00" />
      <Text style={styles.loadingText}>Cargando insignias...</Text>
      </View>
    ) : insignias.length === 0 ? (
      <View style={styles.emptyContainer}>
      <Ionicons name="ribbon-outline" size={48} color="#474747" />
      <Text style={styles.emptyText}>
      Aún no tienes insignias. Visita la tienda para adquirir algunas.
      </Text>
      </View>
    ) : (
      <FlatList
      data={insignias}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
        style={[
          styles.cosmeticoCard,
          item.equipado && styles.cosmeticoCardEquipado,
        ]}
        onPress={() => handleEquipInsignia(item)}
        activeOpacity={0.8}
        >
        {item.equipado && (
          <View style={styles.equipadoBadge}>
          <Ionicons
          name="checkmark-circle"
          size={16}
          color="#0a0a0a"
          />
          </View>
        )}
        
        <View
        style={[
          styles.cosmeticoIconContainer,
          { backgroundColor: '#FACC1522' },
        ]}
        >
        {item.icon_family === 'Ionicons' ? (
          <Ionicons
          name={item.icon_name}
          size={30}
          color={item.color}
          />
        ) : (
          <FontAwesome5
          name={item.icon_name}
          size={26}
          color={item.color}
          />
        )}
        </View>
        
        <Text
        style={[
          styles.cosmeticoNombre,
          item.equipado && styles.cosmeticoNombreEquipado,
        ]}
        numberOfLines={2}
        >
        {item.name}
        </Text>
        </TouchableOpacity>
      )}
      numColumns={3}
      columnWrapperStyle={styles.cosmeticsGrid}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 8 }}
      />
    )}
    
    {/* Nota */}
    <View style={styles.cosmeticsNote}>
    <Ionicons
    name="information-circle-outline"
    size={14}
    color="#6B7280"
    />
    <Text style={styles.cosmeticsNoteText}>
    Toca una insignia para equiparla y mostrarla junto a tu nombre.
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
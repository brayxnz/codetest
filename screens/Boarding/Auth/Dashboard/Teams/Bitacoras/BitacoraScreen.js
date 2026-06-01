import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../../../../../CBD';
import { useFocusEffect } from '@react-navigation/native';

export default function BitacoraScreen({ navigation, route }) {
  const { teamId } = route.params;
  const [bitacoras, setBitacoras] = useState([]);
  const [filteredBitacoras, setFilteredBitacoras] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBitacora, setSelectedBitacora] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Modal para filtro de fases
  const [faseModalVisible, setFaseModalVisible] = useState(false);
  const [selectedFase, setSelectedFase] = useState('Todas');

  const fases = [
    'Todas',
    'La Idea',
    'Definición del problema o necesidad',
    'Fundamentos teóricos',
    'Diseño de la investigación',
    'Diseño de la ingeniería',
    'Presentación de resultados',
  ];

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      init();
    }, [teamId])
  );

  const init = async () => {
    setLoading(true);
    await Promise.all([loadTeamMembers(), loadBitacoras()]);
    setLoading(false);
  };

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
                id_user,
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
      }));
      setTeamMembers(members);
    }
  };

  const loadBitacoras = async () => {
    const { data, error } = await supabase
      .from('team_bitacora')
      .select('*')
      .eq('id_team', teamId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBitacoras(data);
      filterByFase(data, selectedFase); // Aplicar filtro inicial
    }
  };

  const handleLongPress = (bitacora) => {
    setSelectedBitacora(bitacora);
    setModalVisible(true);
  };

  const getResponsableName = (id) => {
    const member = teamMembers.find((m) => m.id_user === id);
    return member ? member.name : 'Desconocido';
  };

  const filterByFase = (bitacorasList, fase) => {
    if (fase === 'Todas') {
      setFilteredBitacoras(bitacorasList);
    } else {
      const filtered = bitacorasList.filter((b) => b.fase === fase);
      setFilteredBitacoras(filtered);
    }
  
  };
  const handleSelectFase = (fase) => {
    setSelectedFase(fase);
    filterByFase(bitacoras, fase);
    setFaseModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#d44e00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bitácora del Proyecto</Text>
      </View>

      {/* Selector de fase para filtrar */}
      <TouchableOpacity
        style={styles.faseFilter}
        onPress={() => setFaseModalVisible(true)}>
        <Text style={{ color: '#fff' }}>{selectedFase}</Text>
        <Ionicons name="chevron-down" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={faseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFaseModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setFaseModalVisible(false)}>
          <View style={styles.modalContent}>
            <ScrollView style={{ paddingBottom: 90 }}>
              {fases.map((f, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectFase(f)}>
                  <Text style={styles.modalItemText}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {filteredBitacoras.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay entradas de bitácora aún</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 1, paddingBottom: 90 }}
          data={filteredBitacoras}
          keyExtractor={(item) => item.id_bitacora.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onLongPress={() => handleLongPress(item)}>
              <Text style={styles.cardPhase}>{item.fase}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
              <Text
                style={styles.cardContent}
                numberOfLines={2}
                ellipsizeMode="tail">
                {item.contenido}
              </Text>
              {item.created_by && (
                <Text style={styles.cardMember}>
                  Responsable: {getResponsableName(item.created_by)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('CreateBitacora', { teamId, teamMembers })
          }
          activeOpacity={0.7}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      {/* Modal para ver más información */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedBitacora && (
                <>
                  <Text style={styles.modalPhase}>{selectedBitacora.fase}</Text>
                  <Text style={styles.modalTitle}>
                    {selectedBitacora.title}
                  </Text>
                  <Text style={styles.modalDate}>
                    {new Date(selectedBitacora.created_at).toLocaleString()}
                  </Text>
                  <Text style={styles.modalContentText}>
                    {selectedBitacora.contenido}
                  </Text>
                  {selectedBitacora.created_by && (
                    <Text style={styles.modalMember}>
                      Responsable:{' '}
                      {getResponsableName(selectedBitacora.created_by)}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 50 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  addButton: {
    position: 'absolute',
    bottom: 105,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d44e00',
    justifyContent: 'center',
    alignItems: 'center',
    },
  faseFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    justifyContent: 'space-between',
    backgroundColor: '#141414',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: { color: '#666', fontSize: 16, fontStyle: 'italic' },
  card: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginHorizontal: 10,
  },
  cardPhase: { color: '#d44e00', fontWeight: '700', marginBottom: 4 },
  cardTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDate: { color: '#888', fontSize: 12, marginBottom: 8 },
  cardContent: { color: '#fff', fontSize: 14, lineHeight: 18 },
  cardMember: { color: '#ccc', fontSize: 12, marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalPhase: {
    color: '#d44e00',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
  },
  modalDate: { color: '#888', fontSize: 12, marginBottom: 12 },
  modalContentText: { color: '#fff', fontSize: 14, marginBottom: 12 },
  modalMember: { color: '#ccc', fontSize: 14, marginBottom: 12 },
  closeButton: {
    backgroundColor: '#d44e00',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeText: { color: '#fff', fontWeight: '700' },

  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  modalItemText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

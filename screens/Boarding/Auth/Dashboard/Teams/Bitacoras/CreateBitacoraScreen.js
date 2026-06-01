import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../../../../../CBD';

export default function CreateBitacora({ route, navigation }) {
  const { teamId, teamMembers } = route.params;

  const [fase, setFase] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [faseModalVisible, setFaseModalVisible] = useState(false);

  const fases = [
    'La Idea',
    'Definición del problema o necesidad',
    'Fundamentos teóricos',
    'Diseño de la investigación',
    'Diseño de la ingeniería',
    'Presentación de resultados',
  ];

  const handleSave = async () => {
    if (!fase || !title.trim() || !content.trim()) {
      return Alert.alert(
        'Campos obligatorios',
        'Por favor completa fase, título y contenido'
      );
    }
    setSaving(true);

    const { data, error } = await supabase
      .from('team_bitacora')
      .insert([
        {
          id_team: teamId,
          fase,
          title,
          contenido: content,
          created_by: selectedMember || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    setSaving(false);

    if (error) return Alert.alert('Error', error.message);

    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, paddingTop: 40 }}>
        {/* HEADER FIJO */}
        <View style={styles.headerContainer}>
          <Ionicons name="document-text" size={24} color="#d44e00" />
          <Text style={styles.header}>Crear registro de Bitácora</Text>
        </View>

        {/* SCROLLVIEW CON CONTENIDO */}
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>
          {/* Selector de fase */}
          <Text style={styles.label}>Fase del Prototipo</Text>
          <TouchableOpacity
            style={styles.faseSelector}
            onPress={() => setFaseModalVisible(true)}
            activeOpacity={0.7}>
            <Text style={{ color: fase ? '#fff' : '#888' }}>
              {fase || 'Selecciona una fase'}
            </Text>
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
                <ScrollView>
                  {fases.map((f, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        setFase(f);
                        setFaseModalVisible(false);
                      }}>
                      <Text style={styles.modalItemText}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Título */}
          <Text style={styles.label}>Título del registro</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe el título del registro..."
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />

          {/* Contenido */}
          <Text style={styles.label}>Contenido de la actividad</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe brevemente lo que se realizó..."
            placeholderTextColor="#666"
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* Responsable */}
          <Text style={styles.label}>Responsable (opcional)</Text>
          {teamMembers.map((member) => (
            <TouchableOpacity
              key={member.id_user}
              style={[
                styles.memberButton,
                selectedMember === member.id_user && styles.memberButtonActive,
              ]}
              onPress={() => setSelectedMember(member.id_user)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.memberText,
                  selectedMember === member.id_user && styles.memberTextActive,
                ]}>
                {member.name} (@{member.username})
              </Text>
            </TouchableOpacity>
          ))}

          {/* Guardar */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveText}>
              {saving ? 'Guardando...' : 'Guardar registro'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={{ width: '90%', justifyContent: 'center' }}>
              <Text
                style={{
                  color: '#d44e00',
                  fontWeight: 'bold',
                  alignSelf: 'center',
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginTop: 5,
                  marginLeft: '6%',
                }}>
                Cancelar
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
    gap: 12,
    zIndex: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  container: {
    padding: 24,
    paddingBottom: 90,
  },
  label: {
    color: '#d44e00',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  faseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#252525',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    maxHeight: '60%',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  modalItemText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  memberButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#252525',
    marginBottom: 6,
  },
  memberButtonActive: {
    backgroundColor: '#d44e00',
    borderColor: '#d44e00',
  },
  memberText: { color: '#CCCCCC' },
  memberTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d44e00',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

// screens/Teams/TeamFiles.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../../CBD';

function formatMB(mb) {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export default function FilesScreen({ route }) {
  const { teamId, teamName } = route.params || {};

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Datos básicos de almacenamiento (luego vendrán de Supabase / BD)
  const [usedMB, setUsedMB] = useState(0);
  const [limitMB, setLimitMB] = useState(5120); // ej. 5 GB por equipo boosteado

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);

      // TODO: aquí harás el listado real desde Supabase Storage:
      // - supabase.storage.from('team-files').list(`team-${teamId}/...`)
      // - sumar tamaños para calcular usedMB
      // Por ahora, dejamos el arreglo vacío como placeholder.
      setFiles([]);
      setUsedMB(0);
    } catch (e) {
      console.log('Error cargando archivos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      loadFiles();
    }
  }, [teamId, loadFiles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const usedPercent = limitMB > 0 ? Math.min((usedMB / limitMB) * 100, 100) : 0;

  const handleUploadPress = () => {
    // TODO: abrir DocumentPicker / ImagePicker y subir al bucket de Supabase.
    // Aquí solo mostramos un log temporal.
    console.log('Upload file for team:', teamId);
  };

  const renderFileItem = ({ item }) => (
    <View style={styles.fileRow}>
      <View style={styles.fileIconWrapper}>
        <Ionicons name="document-text-outline" size={22} color="#FBBF24" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileMeta}>
          {formatMB(item.sizeMB)} · {item.createdAt}
        </Text>
      </View>
      <TouchableOpacity style={styles.fileActionBtn}>
        <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d44e00" />
        <Text style={styles.loadingText}>Cargando archivos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cloud-outline" size={26} color="#d44e00" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Archivos</Text>
            <Text style={styles.headerSubtitle}>
              Equipo: {teamName || 'Sin nombre'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUploadPress}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.uploadBtnText}>Subir archivo</Text>
        </TouchableOpacity>
      </View>

      {/* RESUMEN DE ALMACENAMIENTO */}
      <View style={styles.storageCard}>
        <View style={styles.storageRow}>
          <Text style={styles.storageTitle}>Almacenamiento del equipo</Text>
        </View>

        <Text style={styles.storageNumbers}>
          {formatMB(usedMB)} / {formatMB(limitMB)}
        </Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${usedPercent}%` },
            ]}
          />
        </View>

        <Text style={styles.storageHint}>
          Este espacio es compartido por todos los miembros del equipo.
        </Text>
      </View>

      {/* LISTADO DE ARCHIVOS */}
      <FlatList
        data={files}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={[
          styles.listContent,
          files.length === 0 && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#d44e00']}
            tintColor="#d44e00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="folder-open-outline"
              size={56}
              color="#4B5563"
            />
            <Text style={styles.emptyTitle}>Sin archivos todavía</Text>
            <Text style={styles.emptyText}>
              Sube documentos, imágenes o recursos importantes para que todo el
              equipo pueda acceder.
            </Text>
            <TouchableOpacity
              style={styles.emptyUploadBtn}
              onPress={handleUploadPress}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.emptyUploadText}>Subir archivo</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderFileItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d44e00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  storageCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2933',
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
  },
  storageBadge: {
    backgroundColor: '#065F46',
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  storageNumbers: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  progressBarBackground: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1F2933',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d44e00',
  },
  storageHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  fileIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2933',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  fileActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d44e00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 16,
  },
  emptyUploadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
});
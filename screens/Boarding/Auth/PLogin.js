import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../../../CBD';

export default function PLogin({ navigation }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!user || !pass) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Query directa a la tabla users
      // En handleLogin, después de validar el usuario:
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Credenciales inválidas');
        setLoading(false);
        return;
      }

      // Guarda los datos del usuario en AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      console.log('Usuario autenticado:', data);
      navigation.replace('HomeTabs');
      // Login exitoso - guarda los datos del usuario
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.contMayor}>
      <StatusBar style="light" /> 
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contMenor}>
            <Image
              source={require('../../../assets/logo.png')}
              style={{
                width: 300,
                height: 80,
                alignSelf: 'center',
                marginLeft: '5%',
              }}
            />
            <Text style={styles.header}>Inicia sesión</Text>
          </View>
          
          <View style={styles.div} />
          
          <View style={styles.contMenor}>
            <TextInput
              placeholderTextColor="lightgray"
              placeholder="Usuario"
              value={user}
              onChangeText={setUser}
              style={styles.input}
              autoCapitalize="none"
              editable={!loading}
            />
            <TextInput
              placeholderTextColor="lightgray"
              placeholder="Contraseña"
              secureTextEntry
              value={pass}
              onChangeText={setPass}
              style={styles.input}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.btnPpal} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnTxt}>Entrar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSec}
              onPress={() => {
                navigation.replace('PSignUp');
              }}
              disabled={loading}
            >
              <Text style={{fontWeight: 'bold',color: '#d44e00'}}>No tengo una cuenta</Text>
            </TouchableOpacity>
            <View style={styles.divVertical} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contMayor: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#0a0a0a',
  },
  contMenor: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 8,
  },
  btnPpal: {
    backgroundColor: '#d44e00',
    width: '80%',
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    margin: 10,
  },
  btnTxt: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  divVertical: {
    height: 60,
  },
  btnSec: {
    width: '80%',
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
  },
  div: { height: 15 },
  input: {
    borderWidth: 0,
    borderColor: '#d44e00',
    borderRadius: 1,
    borderBottomWidth: 1,
    padding: 10,
    width: '80%',
    alignSelf: 'center',
    marginVertical: 8,
    backgroundColor: 'transparent',
    color: 'white',
  },
});

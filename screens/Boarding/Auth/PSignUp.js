import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator, 
  StyleSheet, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../../../CBD';

export default function SBLoginConn({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [psw, setPsw] = useState('');
  const [loading, setLoading] = useState(false);
  
async function handleSignUp() {
  if (!nombre || !username || !psw) {
    if (Platform.OS === 'web') {
      alert('Por favor completa todos los campos');
      return;
    }
    Alert.alert('Faltan datos', 'Por favor completa todos los campos');
    return;
  }

  if (psw.length < 6) {
    if (Platform.OS === 'web') {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (username.includes(' ')) {
    if (Platform.OS === 'web') {
      alert('El usuario no puede contener espacios');
      return;
    }
    Alert.alert('Error', 'El usuario no puede contener espacios');
    return;
  }

  setLoading(true);

  try {
    // 1) Verificar si el username ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      Alert.alert('Error', 'Este nombre de usuario ya está en uso');
      setLoading(false);
      return;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error al verificar usuario:', checkError);
      Alert.alert(
        'Error',
        'No se pudo verificar la disponibilidad del usuario'
      );
      setLoading(false);
      return;
    }

    // 2) Crear el nuevo usuario
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name: nombre,
          username: username,
          password: psw,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear usuario:', insertError);
      Alert.alert('Error', 'No se pudo crear la cuenta. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    // 3) Estructura que guardamos en AsyncStorage (equipped_badge null al inicio)
    const userDataToStore = {
      ...newUser,
      equipped_badge: null,
    };

    if (Platform.OS === 'web') {
      localStorage.setItem('userData', JSON.stringify(userDataToStore));
    } else {
      await AsyncStorage.setItem('userData', JSON.stringify(userDataToStore));
    }

    console.log('Usuario creado exitosamente:', userDataToStore);

    // 4) Navegar
    if (Platform.OS === 'web') {
      navigation.replace('HomeTabs');
      return;
    }
    Alert.alert('Cuenta creada', `¡Bienvenido a CodeNest, ${nombre}!`, [
      {
        text: 'Continuar',
        onPress: () => navigation.replace('HomeTabs'),
      },
    ]);
  } catch (error) {
    console.error('Error en el registro:', error);
    Alert.alert(
      'Error',
      'Ocurrió un error inesperado. Por favor intenta nuevamente.'
    );
  } finally {
    setLoading(false);
  }
}  return (
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
    style={{width: 300, height: 80, alignSelf: 'center', marginBottom: 20, marginLeft:'5%' }}
    />
    <Text style={styles.header}>Regístrate</Text>
    
    <View style={styles.divVertical} />
    
    <TextInput
    placeholder="Nombre completo"
    placeholderTextColor="lightgray"
    value={nombre}
    onChangeText={setNombre}
    style={styles.input}
    editable={!loading}
    autoCapitalize="words"
    />
    
    <TextInput
    placeholder="Usuario (sin espacios)"
    placeholderTextColor="lightgray"
    value={username}
    onChangeText={setUsername}
    style={styles.input}
    editable={!loading}
    autoCapitalize="none"
    />
    
    <TextInput
    placeholder="Contraseña (mín. 6 caracteres)"
    placeholderTextColor="lightgray"
    value={psw}
    onChangeText={setPsw}
    secureTextEntry
    autoCapitalize="none"
    style={styles.input}
    editable={!loading}
    />
    
    <View style={styles.div} />
    
    <TouchableOpacity
    onPress={handleSignUp}
    disabled={loading}
    style={[styles.btnPpal, loading && styles.btnDisabled]}
    >
    {loading ? (
      <ActivityIndicator color="white" />
    ) : (
      <Text style={styles.btnTxt}>Crear y entrar</Text>
    )}
    </TouchableOpacity>
    
    <TouchableOpacity
    onPress={() => navigation.replace('PLogin')}
    style={styles.btnSec}
    disabled={loading}
    >
    <Text style={{fontWeight: 'bold',color: '#d44e00'}}>Ya tengo una cuenta</Text>
    </TouchableOpacity>
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
  btnDisabled: {
    opacity: 0.6,
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
  div: { 
    height: 15 
  },
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

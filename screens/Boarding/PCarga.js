import React, { useEffect } from 'react';
import {
  View,
  SafeAreaView,
  Image,
  StyleSheet,
  ActivityIndicator, 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PCarga({ navigation }) {
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      // Verifica si existe userData guardado (desde el login)
      const savedUserData = await AsyncStorage.getItem('userData');

      // Espera 2 segundos para mostrar la animación
      setTimeout(() => {
        if (savedUserData) {
          // Usuario ya está logueado, ir a HomeTabs
          navigation.replace('HomeTabs');
        } else {
          // No hay sesión, ir a Intro/Login
          navigation.replace('Intro');
        }
      }, 2500);
      
    } catch (error) {
      console.log('Error al verificar login:', error);
      // En caso de error, ir a Intro por seguridad
      setTimeout(() => {
        navigation.replace('Intro');
      }, 2000);
    }
  };
  return (
    <SafeAreaView style={styles.cont}>
      <StatusBar style="light" />
      <Image 
        source={require('../../assets/animation.gif')} 
        style={styles.logo} 
      />
      <View style={styles.divVertical} />
      <ActivityIndicator 
        size="large" 
        color="#d44e00" 
        style={styles.loader} 
      />
    </SafeAreaView>
  );
}

/* -------------------- Estilos -------------------- */
const styles = StyleSheet.create({
  cont: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 8,
  },
  logo: {
    width: 320, 
    height: 100, 
    alignSelf: 'center'
  },
  divVertical: {
    height: 60,
  },
  loader: {
    marginTop: 20,
  },
});

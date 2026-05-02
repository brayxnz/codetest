import {
  View, Text, SafeAreaView, TouchableOpacity, Image, StyleSheet,
  } from 'react-native';
import { StatusBar } from 'expo-status-bar';
export default function PBienvenida({ navigation }) {
  return (
    <SafeAreaView style={styles.cont}>
    <StatusBar style="light" /> 
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: 300, height: 80, alignSelf: 'center' }}
      />
      <View style={styles.divVertical}></View>
      <Text style={styles.txt}>
        Organiza tus proyectos, asigna tareas y colabora en tiempo real con tu
        equipo.
      </Text>
      <View style={styles.divVertical}></View>
      <TouchableOpacity
        style={styles.btnLogin}
        onPress={function () {
          navigation.replace('PLogin');
        }}>
        <Text style={styles.btnTxt}>Iniciar Sesión</Text>
      </TouchableOpacity>
      <View style={styles.div}></View>
      <TouchableOpacity
        style={styles.btnSec}
        onPress={function () {
          navigation.navigate('PSignUp');
        }}>
        <Text style={{fontWeight: 'bold',color: '#d44e00'}}>Registrarse</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cont: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 8,
  },
  btnTxt: {
    color: 'white',
    fontWeight: 'bold',
  },
  txt: {
    color: 'white',
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 6,
  },
  divVertical: {
    height: 60,
  },
  btnLogin: {
    backgroundColor: '#d44e00',
    width: '80%',
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
  },
  btnSec: {
    width: '80%',
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
  },
  div: { height: 15 },
});

import {
  View,
  Text,
  TouchableOpacity, SafeAreaView,
  Image, StyleSheet
} from 'react-native';
import Swiper from 'react-native-swiper';
import { StatusBar } from 'expo-status-bar';

export default function PSlides({ navigation }) {
  const slides = [
    {
      id: 1,
      title: 'Bienvenido a CodeNest',
      text: 'Organiza tus proyectos de forma visual y eficiente.',
      img: require('../../assets/logo.png'),
    },
    {
      id: 2,
      title: 'Colabora en equipo',
      text: 'Comunícate y comparte archivos con tu grupo en tiempo real.',
      img: require('../../assets/slide2.png'),
    },
    {
      id: 3,
      title: 'Cumple tus metas',
      text: 'Convierte tus ideas en resultados, paso a paso.',
      img: require('../../assets/slide3.png'),
    },
    {
      id: 4,
      title: '¡Empecemos!',
      text: 'Tu camino hacia la productividad comienza ahora.',
      img: require('../../assets/slide1.png'),
    },
  ];
  function irLogin() {
    navigation.replace('PBienvenida');
  }
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0a0a0a'}}>
    <StatusBar style="light" /> 

    <Swiper horizontal={true} loop={false} showsButtons={true} activeDotColor="#d44e00">
      {slides.map(function (s, i) {
        return (
          <View key={s.id} style={styles.slide}>
            <Image source={s.img} style={styles.slideImg} />
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideText}>{s.text}</Text>

            {i === slides.length - 1 ? (
              <TouchableOpacity
                style={[styles.btnPpal, { marginTop: 20 }]}
                onPress={irLogin}>
                <Text style={styles.btnTxt}>Comenzar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </Swiper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  slideImg: {
    width: 250,
    height: 250,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  slideTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slideText: {
    fontSize: 16,
    color: 'lightgray',
    textAlign: 'center',
    marginTop: 10,
    width: '80%',
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
});

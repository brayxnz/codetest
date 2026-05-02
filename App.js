import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PCarga from './screens/Boarding/PCarga'
import PSlides from './screens/Boarding/PSlides'
import PBienvenida from './screens/Boarding/PBienvenida'
import PLogin from './screens/Boarding/Auth/PLogin'
import PSignUp from './screens/Boarding/Auth/PSignUp'
import HomeTabs from './screens/Boarding/Auth/Dashboard/HomeTabs'
import TeamsTabs from './screens/Boarding/Auth/Dashboard/Teams/TeamsTabs'
const Stack = createNativeStackNavigator();

export function App1() {  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={PCarga} />
        <Stack.Screen name="Intro" component={PSlides} />
        <Stack.Screen name="PBienvenida" component={PBienvenida} />
        <Stack.Screen name="PLogin" component={PLogin} />
        <Stack.Screen name="PSignUp" component={PSignUp} />
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="TeamsTabs" component={TeamsTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default function App() {  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={PCarga} />
        <Stack.Screen name="Intro" component={PSlides} />
        <Stack.Screen name="PBienvenida" component={PBienvenida} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
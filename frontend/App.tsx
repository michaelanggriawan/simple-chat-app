import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RoomScreen from './screens/RoomScreen';
import ChatScreen from './screens/ChatScreen';

function App(): JSX.Element {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="RoomScreen"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#008000',
          },
          headerTintColor: '#fff',
        }}>
        <Stack.Screen
          name="RoomScreen"
          component={RoomScreen}
          options={{title: 'Join Room', headerTitleAlign: 'center'}}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{title: 'Chat Room', headerTitleAlign: 'center'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

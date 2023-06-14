import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const RoomScreen = (): JSX.Element => {
  const [roomId, setRoomId] = useState('');
  const [joinRoom, setJoinRoom] = useState('');
  const navigation = useNavigation();

  const onCreateRoom = async () => {
    // Make a POST request to the backend API to create a new room
    try {
      const response = await fetch('http://localhost:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({room_id: roomId}),
      });
      setRoomId('');
      const result = await response.json();
      if (!result.success) {
        Alert.alert(result.error);
        return;
      }
      // @ts-ignore
      navigation.navigate('ChatScreen', {roomId: result.data.room_id});
    } catch (err) {
      console.error(err);
      setRoomId('');
    }
  };

  const onJoinRoom = async () => {
    try {
      const response = await fetch('http://localhost:8000/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({room_id: joinRoom}),
      });
      setJoinRoom('');
      const result = await response.json();
      if (!result.success) {
        Alert.alert(result.error);
        return;
      }
      // @ts-ignore
      navigation.navigate('ChatScreen', {roomId: joinRoom});
    } catch (err) {
      console.error(err);
      setRoomId('');
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.text}>Create Room</Text>
      <View style={styles.roomSection}>
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Enter room ID"
            value={roomId}
            onChangeText={setRoomId}
            style={styles.input}
          />
        </View>
        <View style={styles.button}>
          <Button title="Create" onPress={onCreateRoom} />
        </View>
      </View>
      <Text style={[styles.text, styles.m20]}>Join Room</Text>
      <View style={styles.roomSection}>
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Enter existing room ID"
            value={joinRoom}
            onChangeText={setJoinRoom}
            style={styles.input}
          />
        </View>
        <View style={styles.button}>
          <Button title="Join" color="#008000" onPress={onJoinRoom} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 32,
  },
  text: {
    color: '#000',
  },
  roomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  formContainer: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    height: 40,
    width: '100%',
    color: '#000',
  },
  m20: {
    marginTop: 20,
  },
  button: {
    width: 90,
  },
});

export default RoomScreen;

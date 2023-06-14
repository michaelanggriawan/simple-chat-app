import {useRoute} from '@react-navigation/native';
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';

const ChatScreen = (): JSX.Element => {
  const route = useRoute();
  const params = route.params;
  const [messages, setMessages] = useState<any>([]);
  const [messageInput, setMessageInput] = useState('');

  const ws = useMemo(
    // @ts-ignore
    () => new WebSocket(`ws://localhost:8000/ws/${params?.roomId}`),
    // @ts-ignore
    [params?.roomId],
  );

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/rooms/chats/${params.roomId}`,
        );
        const result = await response.json();
        if (result.data?.length) {
          setMessages(result.data);
        }
        if (!result.success) {
          Alert.alert(result.error);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    })();
    // @ts-ignore
  }, [params?.roomId]);

  useEffect(() => {
    // Event handler for when the connection is established
    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    // Event handler for errors
    ws.onerror = (error: any) => {
      console.log('WebSocket error:', error);
    };

    // Event handler for when the connection is closed
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, [ws]);

  useEffect(() => {
    // Event handler for incoming messages
    ws.onmessage = (event: any) => {
      const receivedMessage = event.data;
      setMessages([...messages, receivedMessage]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const renderItem = ({item, index}: {item: any; index: number}) => (
    <View
      style={
        index % 2 === 0
          ? styles.leftMessageContainer
          : styles.rightMessageContainer
      }>
      <Text style={styles.messageText}>{item}</Text>
    </View>
  );

  const handleSend = () => {
    if (messageInput.trim() !== '') {
      setMessages([...messages, messageInput]);
      ws.send(messageInput);
      setMessageInput('');
    }
  };

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <Text style={styles.roomTitle}>Chat Room: {params?.roomId}</Text>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message"
          value={messageInput}
          onChangeText={setMessageInput}
          style={styles.input}
        />
        <Button title="Send" onPress={handleSend} color="#008000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
    color: '#000',
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leftMessageContainer: {
    backgroundColor: '#dcf8c6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  rightMessageContainer: {
    backgroundColor: '#b3e5fc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 16,
    paddingHorizontal: 12,
    color: '#000',
    paddingVertical: 8,
  },
});

export default ChatScreen;

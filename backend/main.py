from fastapi import FastAPI, status, WebSocket, HTTPException, Body
from typing import Dict
from pydantic import BaseModel, validator
import string
import secrets
import certifi
import base64
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from bson import ObjectId

app = FastAPI()
connected_clients = set()
room_clients_map = {}

# mongodb connecttion
client = MongoClient("mongodb+srv://michaelanggriawan:CPwaX0ewYLNb3S8o@cluster0.ztxvb.mongodb.net/general?retryWrites=true&w=majority", tlsCAFile=certifi.where())
db = client["chat_app"]

# class model
class RoomCreate(BaseModel):
    room_id: str

    @validator("room_id")
    def validate_room_id(cls, room_id):
        if len(room_id) != 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be 6 characters long")
        if not room_id.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be a string of numbers")
        if db.rooms.find_one({'room_id': room_id}):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room ID already exists')
        return room_id

class JoinRoomRequest(BaseModel):
    room_id: str
    
    @validator("room_id")
    def validate_room_id(cls, room_id):
        room_doc = db.rooms.find_one({'room_id': room_id})
        if len(room_id) != 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be 6 characters long")
        if not room_id.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be a string of numbers")
        if not room_doc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room ID does not exist')
        return room_id

class ApiResponse(BaseModel):
    statusCode: str
    error: str
    success: bool
    data: dict | str | list

# global exception
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"statusCode": exc.status_code, "success": False, "error": f"{exc.detail}", "data": None})


# util function
def generate_encryption_key(length: int = 16) -> str:
    characters = string.ascii_letters + string.digits
    encryption_key = ''.join(secrets.choice(characters) for _ in range(length))
    
    return encryption_key

def encrypt_message(message: str, encryption_key: str) -> str:
    encoded_message = message.encode('utf-8')
    encoded_key = encryption_key.encode('utf-8')

    # Perform encryption logic here using the encryption key
    encrypted_message = encoded_message + encoded_key

    # Base64 encode the encrypted message for transmission
    encoded_encrypted_message = base64.b64encode(encrypted_message).decode('utf-8')
    return encoded_encrypted_message


def decrypt_message(encoded_message: str, encryption_key: str) -> str:
    # Base64 decode the received message
    decoded_message = base64.b64decode(encoded_message.encode('utf-8'))

    # Extract the original message and encryption key
    original_message = decoded_message[:-len(encryption_key)]
    original_key = decoded_message[-len(encryption_key):]

    # Perform decryption logic here using the encryption key
    decrypted_message = original_message.decode('utf-8')
    return decrypted_message


# endpoint
@app.post("/rooms", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_room(room: RoomCreate) -> Dict[str, str]:
    print('DEBUG: ', room)
    # Create API Response 
    response = ApiResponse(
        statusCode=status.HTTP_201_CREATED,
        success=True,
        error="",
        data={}
    )
    # Generate the encryption key for the chat room
    encryption_key = generate_encryption_key()
    
    room_doc = {
        "_id": ObjectId(),
        "room_id": room.room_id,
        "encryption_key": encryption_key,
        "chats": []
    }
    
    # insert to monggo DB
    db.rooms.insert_one(room_doc)
    
    room_doc['_id'] = str(room_doc['_id'])
    
    response.data = room_doc
    
    # Return the encryption key as the response
    return response

@app.post("/rooms/join", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def join_room(request: JoinRoomRequest) -> Dict[str, str]:
    # Create API Response 
    response = ApiResponse(
        statusCode=status.HTTP_201_CREATED,
        success=True,
        error="",
        data={}
    )
    
    response.data =  "Joined the room successfully"

    return response

@app.get("/rooms/chats/{room_id}", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def chats(room_id: str) -> Dict[str, str]:
    decrypt_chats = []
    if len(room_id) != 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be 6 characters long")
    
    if not room_id.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room ID should be a string of numbers")
    
    room_doc = db.rooms.find_one({'room_id': room_id})
    
    if not room_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room ID does not exist')

    # Create API Response 
    response = ApiResponse(
        statusCode=status.HTTP_200_OK,
        success=True,
        error="",
        data={}
    )
    
    room = db.rooms.find_one({ "room_id": room_id })
    
    for chat in room["chats"]:
        decrypt_chats.append(decrypt_message(chat, room['encryption_key']))
    
    response.data = decrypt_chats
    
    return response

async def broadcast_message(message: str):
    for client in connected_clients:
        await client.send_text(message)

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    # Generate a unique identifier for the client
    client_id = str(id(websocket))
    connected_clients.add(websocket)
    
    # Add the client to the corresponding room's set
    if room_id in room_clients_map:
        room_clients_map[room_id].add(websocket)
    else:
        room_clients_map[room_id] = {websocket}
        
    print('Client connected:', client_id, 'Room ID:', room_id)
        
    try:
        while True:
            room = db.rooms.find_one({ "room_id": room_id })
            # Receive message from the client
            encoded_message = await websocket.receive_text()
            print("Received message from", client_id, ":", encoded_message)
            
            # encrypt the received message using the encryption key
            encrypted_response = encrypt_message(encoded_message, room['encryption_key'])
            
            # Insert the encrypted message to the "chats" field in the room document
            db.rooms.update_one({"room_id": room_id}, {"$push": {"chats": encrypted_response}})

            # decrypt the response message using the encryption key
            decrypt_response = decrypt_message(encrypted_response, room['encryption_key'])
            
            target_clients = room_clients_map.get(room_id)
            if target_clients:
                for client in target_clients:
                    if client != websocket:  # Exclude the client's own WebSocket instance
                        await client.send_text(decrypt_response) 

    finally:
        # Remove the client from the connected clients set
        connected_clients.remove(websocket)
        if room_id in room_clients_map:
            room_clients_map[room_id].remove(websocket)
            if len(room_clients_map[room_id]) == 0:
                del room_clients_map[room_id]


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)

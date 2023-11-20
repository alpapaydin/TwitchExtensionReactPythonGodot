import asyncio
import websockets
from quart import Quart, request, jsonify
from quart_cors import cors
from tts import speak, speak_eng

app = Quart(__name__)
app = cors(app)

button_names = [
    "gamehelp",
    "help",
    "speak",
    "stats",
    "attack",
    "heal",
    "res",
    "reisler",
    "accept",
    "upgrade",
    "biz",
    "buy",
    "sa",
    "chatall",
    "dc",
]
connected_clients = {}  # Dictionary to map websockets to tasks

async def client_handler(websocket):
    try:
        while True:  # Keep listening for a message from the client
            message = await websocket.recv()
            print(f"Received message from client: {message}")
            # Handle the received message
    except websockets.exceptions.ConnectionClosed:
        print("Client connection closed")
    finally:
        if websocket in connected_clients:
            del connected_clients[websocket]

async def websocket_server(websocket, path):
    client_task = asyncio.create_task(client_handler(websocket))
    connected_clients[websocket] = client_task
    await client_task

async def send_message(message):
    if not connected_clients:
        return "No connected clients."

    responses = []
    for client, task in connected_clients.items():
        await client.send(message)
        # Do not call recv() here to avoid conflict with client_handler

    return "Messages sent to all clients."

@app.route('/buttons', methods=['GET'])
async def get_buttons():
    return jsonify(button_names)

@app.route('/hello', methods=['POST'])
async def handle_click():
    try:
        data = await request.json
        button_name = data.get('button')
        user_name = data.get('user', 'Anonymous')
        if user_name == "Anonymous":
            return jsonify(success=False, message="Please allow access to your Twitch ID to interact with the game.")
        message = f"{user_name}.{button_name}.null"
        response = await send_message(message)
        return jsonify(success=True, message=response)
    except Exception as e:
        return jsonify(success=False, message=str(e))

def handleCommand(button_name, user_name):
    match button_name:
        case "speak":
            speak(user_name)
        case "speakeng":
            speak_eng(user_name)

if __name__ == '__main__':
    # Start Quart and WebSocket server asynchronously
    loop = asyncio.get_event_loop()
    start_server = websockets.serve(websocket_server, '0.0.0.0', 8765)
    loop.run_until_complete(start_server)
    loop.run_until_complete(app.run_task(host='localhost', port=3000))

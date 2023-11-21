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
connected_clients = {}  # Maps websockets to tasks
async def client_handler(websocket):
    # Each client gets its own queue for responses
    client_queue = asyncio.Queue()
    connected_clients[websocket] = client_queue

    try:
        while True:
            message = await websocket.recv()
            print(f"Received message from client: {message}")
            await client_queue.put(message)  # Store the message in the queue
    except websockets.exceptions.ConnectionClosed:
        print("Client connection closed")
    finally:
        # Remove the client and its queue when the connection is closed
        if websocket in connected_clients:
            del connected_clients[websocket]

async def websocket_server(websocket, path):
    await client_handler(websocket)

async def send_message(message):
    if not connected_clients:
        return "No connected clients."

    # Get the first client and its response queue
    first_client, client_queue = next(iter(connected_clients.items()))

    # Send the message to the first client
    await first_client.send(message)

    try:
        # Wait for a response from the first client
        response = await asyncio.wait_for(client_queue.get(), timeout=10)
        return response
    except asyncio.TimeoutError:
        return "No response received from the first client."



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

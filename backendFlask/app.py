import asyncio
import websockets
from quart import Quart, request, jsonify
from quart_cors import cors  # Import cors from quart_cors
from tts import speak, speak_eng

app = Quart(__name__)
app = cors(app)  # Use cors with Quart

button_names = [
    "just",
    "test",
    "me",
    "baby"
]

async def send_message(message):
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        await websocket.send(message)
        response = await websocket.recv()
        print(f"Received from Godot: {response}")
        return response  # Return the response

@app.route('/buttons', methods=['GET'])
async def get_buttons():
    return jsonify(button_names)

@app.route('/hello', methods=['POST'])
async def handle_click():
    try:
        data = await request.json
        print(data)
        button_name = data.get('button')
        user_name = data.get('user', 'Anonymous')
        if user_name == "Anonymous":
            return jsonify(success=False, message="Please allow access to your Twitch ID to interact with the game.")
        handleCommand(button_name, user_name)
        message = f"{user_name}.{button_name}.null"
        response = "Test OK!"
        #response = await send_message(message)  # Await the send_message coroutine
        return jsonify(success=True, message=response)  # Return the WebSocket response
    except Exception as e:
        return jsonify(success=False, message=str(e))

def handleCommand(button_name, user_name):
    match button_name:
        case "speak":
            speak(user_name)
        case "speakeng":
            speak_eng(user_name)

if __name__ == '__main__':
    app.run(host='localhost', port=3000)

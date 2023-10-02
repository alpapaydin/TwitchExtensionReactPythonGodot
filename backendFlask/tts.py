from gtts import gTTS
from playsound import playsound

def speak(text, lang='tr'):
    speech = gTTS(text=text, lang=lang, slow=False)
    file_path = "play.mp3"
    speech.save(file_path)
    playsound(file_path)

def speak_eng(text):
    speak(text, lang='en')

# Example usage:
if __name__ == "__main__":
    speak("Merhaba Dünya")
    speak_eng("Hello World")

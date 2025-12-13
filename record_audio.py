import sounddevice as sd
import soundfile as sf

DURATION = 45        # seconds (change to 30–60)
SAMPLE_RATE = 16000 # required for Whisper
CHANNELS = 1

print("🎙 Recording... Speak now")

audio = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=CHANNELS,
    dtype="float32"
)

sd.wait()

sf.write("raw_audio.wav", audio, SAMPLE_RATE)

print("✅ Recording saved as raw_audio.wav")

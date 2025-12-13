import librosa
import soundfile as sf

INPUT_AUDIO = "raw_audio.wav"
OUTPUT_AUDIO = "clean_audio.wav"

def preprocess_audio(input_path, output_path):
    # Load audio
    y, sr = librosa.load(input_path, sr=16000, mono=True)

    # Normalize volume
    y = librosa.util.normalize(y)

    # Remove silence
    y_trimmed, _ = librosa.effects.trim(y, top_db=20)

    # Save cleaned audio
    sf.write(output_path, y_trimmed, sr)

    duration = librosa.get_duration(y=y_trimmed, sr=sr)

    print("✅ Audio preprocessing complete")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Sample Rate: {sr}")

if __name__ == "__main__":
    preprocess_audio(INPUT_AUDIO, OUTPUT_AUDIO)

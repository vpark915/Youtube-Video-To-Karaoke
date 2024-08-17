import resource
from transformers import AutoProcessor, SeamlessM4Tv2Model
import librosa
import torch

# Set up Seamless dependencies
processor = AutoProcessor.from_pretrained("Translation-Service/Seamless-M4T-v2-Large")
model = SeamlessM4Tv2Model.from_pretrained("Translation-Service/Seamless-M4T-v2-Large")

# Convert Audio File into processable Data
file_path = "Translation-Service/Sample-Audio/Denzel Curry - Walkin (Official Audio).wav"
original_sample_rate = librosa.get_samplerate(file_path)
waveform, _ = librosa.load(file_path, sr=original_sample_rate)

# Resample to 16000 Hz
target_sample_rate = 16000
waveform = librosa.resample(waveform, orig_sr=original_sample_rate, target_sr=target_sample_rate)

audio_inputs = processor(audios=waveform, return_tensors="pt", sampling_rate=target_sample_rate)
print(audio_inputs)

# Generate translated text from audio
output_tokens = model.generate(**audio_inputs, tgt_lang="eng", generate_speech=False)
translated_text_from_audio = processor.decode(output_tokens[0].tolist(), skip_special_tokens=True)
print(f"Translated Text: {translated_text_from_audio}")

# Set up the model for translation
src_lang, tgt_lang = "eng", "jpn"
src_lyrics = translated_text_from_audio
text_inputs = processor(text=src_lyrics, src_lang=src_lang, return_tensors="pt")

# Generate translated lyrics
decoder_input_ids = model.generate(**text_inputs, tgt_lang=tgt_lang)[0].tolist()
translated_lyrics = processor.decode(decoder_input_ids, skip_special_tokens=True)
print(f"{tgt_lang}: {translated_lyrics}")
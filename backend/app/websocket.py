import json
from fastapi import WebSocket, WebSocketDisconnect
from app.services.audio_processor import AudioProcessor
from app.services.vad_service import VADService
from app.services.asr_service import ASRService
from app.services.speech_buffer import SpeechBuffer

# Singletons (stateless processor + model loaded once in memory)
audio_processor = AudioProcessor()
asr_service = ASRService(model_size="base.en")

async def transcription_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # Per-session instances: isolated buffer and VAD states
    vad_service = VADService(speech_threshold=0.5)
    speech_buffer = SpeechBuffer()
    
    chunk_count = 0
    speech_chunks = 0

    async def flush_and_transcribe_remaining():
        """Transcribes any leftover audio trapped in the buffer."""
        remaining_audio = speech_buffer.get_audio_and_clear()
        if len(remaining_audio) >= speech_buffer.min_samples:
            asr_result = await asr_service.transcribe_async(remaining_audio)
            final_text = asr_result["text"].strip()
            if final_text:
                print(f"[WHISPER FINAL] Recognized on finalize: '{final_text}'")
                try:
                    await websocket.send_json({
                        "type": "transcript",
                        "text": final_text,
                        "is_final": True,
                    })
                except Exception:
                    pass

    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Transcription & VAD WebSocket connected",
        })

        while True:
            # Handles both binary frames (PCM) and text commands (finalize)
            message = await websocket.receive()
            
            # 1. Process control messages
            if "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if payload.get("action") == "finalize":
                        await flush_and_transcribe_remaining()
                        continue
                except Exception:
                    pass

            # 2. Process raw audio bytes
            if "bytes" not in message or not message["bytes"]:
                continue

            audio_bytes = message["bytes"]
            chunk_count += 1

            # Convert bytes -> NumPy float32 (16kHz) -> PyTorch Tensor
            audio_np = audio_processor.bytes_to_float32(audio_bytes)
            audio_tensor = audio_processor.to_torch_tensor(audio_np)

            # Silero VAD check
            vad_result = vad_service.is_speech(audio_tensor)
            is_speech = vad_result["is_speech"]
            prob = vad_result["probability"]

            if is_speech:
                speech_chunks += 1

            # Add to buffer
            should_transcribe = speech_buffer.add_chunk(audio_np, is_speech)

            # Stream live VAD telemetry
            await websocket.send_json({
                "type": "vad",
                "chunk_number": chunk_count,
                "speech_chunks": speech_chunks,
                "is_speech": is_speech,
                "probability": prob,
            })

            # Run Whisper if threshold or natural pause hit
            if should_transcribe:
                audio_to_transcribe = speech_buffer.get_audio_and_clear()
                asr_result = await asr_service.transcribe_async(audio_to_transcribe)
                transcript_text = asr_result["text"].strip()

                if transcript_text:
                    print(f"[WHISPER] Recognized: '{transcript_text}'")
                    await websocket.send_json({
                        "type": "transcript",
                        "text": transcript_text,
                        "is_final": True,
                    })

    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as exc:
        print(f"WebSocket error: {exc}")
    finally:
        await flush_and_transcribe_remaining()
        speech_buffer.clear()
        vad_service.reset_state()
        try:
            await websocket.close()
        except Exception:
            pass
import json
from fastapi import WebSocket, WebSocketDisconnect
from app.services.audio_processor import AudioProcessor
from app.services.vad_service import VADService
from app.services.asr_service import ASRService
from app.services.speech_buffer import SpeechBuffer

# Pre-loaded singletons
audio_processor = AudioProcessor()
asr_service = ASRService(model_size="base.en")

async def transcription_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # Session-isolated instances
    vad_service = VADService(speech_threshold=0.5)
    speech_buffer = SpeechBuffer()
    
    chunk_count = 0
    speech_chunks = 0
    is_finalized = False

    async def flush_and_transcribe_remaining():
        """Transcribes leftover audio in the buffer and marks finalized."""
        nonlocal is_finalized
        if is_finalized:
            return
        is_finalized = True

        remaining_audio = speech_buffer.get_audio_and_clear()
        if len(remaining_audio) >= speech_buffer.min_samples:
            asr_result = await asr_service.transcribe_async(remaining_audio)
            final_text = asr_result["text"].strip()
            if final_text:
                try:
                    await websocket.send_json({
                        "type": "utterance",
                        "text": final_text,
                        "is_final": True,
                    })
                except Exception:
                    pass

        # Send acknowledgment to the client
        try:
            await websocket.send_json({
                "type": "finalized",
                "status": "flushed",
            })
        except Exception:
            pass

    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Live Transcription & VAD Pipeline Connected",
        })

        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            # 1. Process client control signals (e.g. finalize)
            if "text" in message and message["text"]:
                try:
                    data = json.loads(message["text"])
                    if data.get("action") == "finalize":
                        await flush_and_transcribe_remaining()
                        continue
                except Exception:
                    pass

            # 2. Process incoming PCM audio
            if "bytes" not in message or not message["bytes"]:
                continue

            audio_bytes = message["bytes"]
            chunk_count += 1

            audio_np = audio_processor.bytes_to_float32(audio_bytes)
            audio_tensor = audio_processor.to_torch_tensor(audio_np)

            vad_result = vad_service.is_speech(audio_tensor)
            is_speech = vad_result["is_speech"]
            prob = vad_result["probability"]

            if is_speech:
                speech_chunks += 1

            # Buffer speech & detect silence-based boundary
            should_transcribe = speech_buffer.add_chunk(audio_np, is_speech)

            # Stream real-time VAD telemetry
            await websocket.send_json({
                "type": "vad",
                "chunk_number": chunk_count,
                "speech_chunks": speech_chunks,
                "is_speech": is_speech,
                "probability": prob,
            })

            # Emit utterance when boundary reached
            if should_transcribe:
                audio_to_transcribe = speech_buffer.get_audio_and_clear()
                asr_result = await asr_service.transcribe_async(audio_to_transcribe)
                transcript_text = asr_result["text"].strip()

                if transcript_text:
                    await websocket.send_json({
                        "type": "utterance",
                        "text": transcript_text,
                        "is_final": True,
                    })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        print(f"[WS SERVER ERROR] {exc}")
    finally:
        # Defensive cleanup: flush if connection dropped unexpectedly without finalize
        if not is_finalized:
            await flush_and_transcribe_remaining()
        speech_buffer.clear()
        vad_service.reset_state()
        try:
            await websocket.close()
        except Exception:
            pass
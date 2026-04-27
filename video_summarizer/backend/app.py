import os
import shutil
import time
import asyncio
import concurrent.futures
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.video_processor import process_video

# Changed to ThreadPoolExecutor to fix PyTorch/YOLO multiprocessing serialization crash (Conv Object has no attribute 'bn') on Windows
executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

app = FastAPI(title="Video Summarization for Surveillance System")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount outputs so the frontend can display the summarized video
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

@app.post("/api/upload")
async def upload_video(
    file: UploadFile = File(...),
    confidence: float = Form(0.20),
    fps_sample: int = Form(1),
    summary_length: str = Form("Medium"),
    zone_limit: float = Form(0.3)
):
    """
    Endpoint to receive a surveillance video, process it using YOLOv11 and 
    suspicious activity detection algorithms, and return the summary.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    start_time = time.time()
    
    try:
        # Process the video entirely locally with new dynamic user controls
        # Offload to ThreadPoolExecutor to prevent blocking the FastAPI ASGI event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            process_video,
            file_path, OUTPUT_DIR, confidence, fps_sample, summary_length, zone_limit
        )
        
        elapsed_time = time.time() - start_time
        print(f"[{file.filename}] processed in {elapsed_time:.2f} seconds using multiprocessing architecture.")
        
        # Save to Firebase Firestore (if configured)
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            # Check if environment is properly authenticated
            if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") and not firebase_admin._apps:
                print("⚠️  Firebase Admin SDK credentials not found. Bypassing cloud telemetry sync.")
            else:
                if not firebase_admin._apps:
                    firebase_admin.initialize_app()
                    
                db = firestore.client()
                doc_ref = db.collection('video_summaries').document()
                
                doc_ref.set({
                    'filename': file.filename,
                    'processing_time': elapsed_time,
                    'stats': result.get("stats", {}),
                    'text_summary': result.get("text_summary", ""),
                    'events': result.get("events", []),
                    'timestamp': firestore.SERVER_TIMESTAMP
                })
                print("✅ Successfully uploaded summary logs to Firebase Firestore.")
        except Exception as e:
            # We silently swallow firebase configuration issues so the API still returns the video successfully to the frontend
            print(f"⚠️  Firebase telemetry sync skipped: {e}")
        
        return result
    except Exception as e:
        print(f"[{file.filename}] processing failed: {str(e)}")
        return {"error": "Video processing failed", "details": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8001, reload=True)

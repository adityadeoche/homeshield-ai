# HomeShield AI System Architecture & Technical Report

## 1. Overview
HomeShield AI (formerly ClearView AI) is an advanced, privacy-first Video Summarization & Surveillance platform. The system processes continuous video data locally using state-of-the-art edge AI to intelligently audit footage, extract anomalies (such as weapons, loitering, and restricted zone breaches), and generate highly-compressed highlight reels and text narratives.

## 2. Key Technologies Stack

### Frontend Client
* **Core Framework:** React 18+ (using Vite)
* **Styling:** Tailwind CSS (Dark-themed, dynamic UI)
* **Icons & API:** Lucide-React for UX assets, Axios for REST communication
* **Authentication & Database:** Firebase Authentication (logins) and Firestore (archiving history logs/reports)
* **Routing:** React Router DOM (maintains session states like `user.uid`)

### Backend Inference Engine
* **Core Framework:** FastAPI (Asynchronous Python API server running on Uvicorn Port 8001)
* **Computer Vision:** OpenCV (cv2) for frame extraction and video stitching
* **Object Detection Models:** YOLOv11m (Medium variant) for localized, CPU-optimized edge detection
* **Summarization Tools:** MoviePy (video compression) and LLM wrappers (for generating human-readable text narratives)
* **Parallel Processing:** Native Python `ThreadPoolExecutor` and `ProcessPoolExecutor`

## 3. Advanced Techniques & "Small Things"

The platform utilizes several highly specialized, performance-driven heuristics:

1. **MOHASA Optimization (Importance Scoring):** 
   A simulated annealing-inspired approach where frames hold an "Importance Score" (High=5, Medium=3, Low=1). Frames with no event/score are dumped, effectively reducing video size by 80-90% while keeping 100% of the threat payload.
   
2. **Asynchronous Producer-Consumer Pipeline:**
   Instead of blocking frame analysis, `ThreadPoolExecutor (max_workers=3)` acts as a producer where `detector.detect()` evaluates frames ahead of the tracker. A bounded window queue (size 4) catches YOLO's completed objects dynamically.

3. **Global Thread-Safe Initialization:**
   The `ObjectDetector` is initialized via a Singleton pattern (`GLOBAL_DETECTOR`). YOLOv11m is loaded into memory only *once* globally, avoiding RAM bottlenecks when handling multiple or concurrent video uploads.

4. **Multi-Process Offloading:** 
   The FastAPI server offloads the heavy video compression tasks to a `ProcessPoolExecutor` (2 worker limit) ensuring the API event loop remains unblocked and responsive to the frontend.

## 4. End-to-End System Flow

### A. The User Journey (Frontend)
1. **Onboarding:** Operators log in securely using Firebase Auth.
2. **Dashboard Deployment:** A raw `.mp4` surveillance clip is uploaded. The user configures Hyperparameters:
   * **Confidence Target:** Sets the certainty threshold.
   * **Inference Rate (FPS):** E.g., 1 FPS optimized or 5 FPS heavy compute.
   * **Context Depth:** Determines summary aggressiveness (Short/Medium/Long).
3. **API Dispatch:** Video and parameters are pushed to `http://localhost:8001/api/upload`.
4. **Live Analysis:** Once complete, operators interact with a rich dashboard featuring side-by-side original/optimized video playback, ML analytics distributions, Event Logs, and AI-generated narrative reports.
5. **Archiving:** Event records can be explicitly pushed to the Cloud History view (Firestore) for long-term secure storage and review without re-rendering the raw video.

### B. The Inference Pipeline (Backend)
1. **Extraction:** OpenCV isolates frames based on the requested FPS mode.
2. **Detection & Tracking (YOLOv11):** Bounding boxes, confidence scores, and centroid trackers (to maintain entity identities across timestamps) are applied.
3. **Event Heuristics Applied:**
   * *Weapon Detection:* Calculates bounding-box intersection areas between a "person" and "weapon" (e.g., knife). If > 0 area, a HIGH severity alert is triggered (person is holding a weapon).
   * *Loitering Detection:* Tracks an ID over time. If `Current Time - Initial Time > 8 seconds`, it flags a MEDIUM severity alert.
   * *Restricted Zones:* Validates if coordinates overlap with specific screen polygons.
   * *Suspicious Activity:* Triggers via rapid background subtractions.
4. **Packaging:** The Optimizer patches together the flagged frames, constructs an LLM text narrative, and resolves a JSON payload back to the React UI containing all arrays, logs, and video locations.


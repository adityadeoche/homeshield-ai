# HomeShield AI: System Architecture & Processing Walkthrough

This document provides a comprehensive walkthrough of the **HomeShield AI** (formerly ClearView AI) Video Summarization & Surveillance platform. It covers the end-to-end data flow, frontend architecture, and the newly implemented high-performance multithreaded backend.

---

## 1. High-Level Architecture

The system is divided into two primary parts:
*   **Frontend (React + Tailwind CSS):** A dark-themed, modernized dashboard for operators to upload footage, configure model settings, view detailed analytics narratives, and review cloud-synced historical archives.
*   **Backend (FastAPI + Python + OpenCV):** A high-performance inference engine running YOLOv11m, motion detection algorithms, and LLM-based narrative generation.

---

## 2. The User Journey (Frontend Flow)

### A. Authentication & Onboarding (`Login.jsx`)
*   The operator lands on the **HomeShield AI** access terminal.
*   Utilizing **Firebase Authentication**, they can either register an operator account or sign in securely.
*   Once authenticated, the session state (`user.uid`) is maintained throughout the app using React Router.

### B. Deployment & Configuration (`Dashboard.jsx`)
*   The user uploads a raw surveillance `.mp4` video.
*   They can configure **Model Hyperparameters**:
    *   **Confidence Target:** Filters out low-certainty detections (e.g., 0.20 to 0.80).
    *   **Inference Rate (FPS):** Determines how many frames per second the backend samples (skipping intermediate frames drastically improves speed).
    *   **Context Depth:** Dictates the aggressiveness of the video length compression (Short, Medium, Long).
*   Upon clicking "Execute Analysis", a `multipart/form-data` request is dispatched to the FastAPI backend at `http://localhost:8001/api/upload`.

### C. Live Analysis & Report (`Analysis.jsx`)
*   Once the backend responds, the user enters the live Analysis view.
*   This rich dashboard contains:
    *   **Interactive Playback:** Side-by-side verification of original vs. "MOHASA Optimized" AI-compressed footage.
    *   **ML Analytics Graph:** Visual representation of threat distributions.
    *   **Narrative Report:** An AI-generated, human-readable summary of the events that transpired.
    *   **Event Log:** Exact chronological timestamps of every detected bounding box, motion spike, or restricted zone breach.

### D. Cloud Archiving (`History.jsx`)
*   Operators can push an analysis report to the cloud (Firebase Firestore).
*   The History archive displays all past incidents mapped dynamically by date/time.
*   *New Implementation:* Clicking any archive card dynamically rebuilds the exact **Analysis** view specifically for that record, stripping away raw video playback (to save bandwidth) and only exposing the Analytics and Text Report.

---

## 3. The Inference Pipeline (Backend Flow)

The backend (`app.py` & `video_processor.py`) intercepts the video and subjects it to a rigorous pipeline.

### Step 1: Request Offloading (Parallel Execution Map)
When `/api/upload` is called, the system prevents blocking the ASGI event loop using **ProcessPoolExecutor** (2 background worker limits). This allows the FastAPI server to keep accepting API calls from the frontend even while heavily utilizing the CPU to process videos.

### Step 2: Thread-Safe Global Initialization
In `video_processor.py`, `ObjectDetector` is initialized via a Singleton pattern (`GLOBAL_DETECTOR`). YOLOv11m only gets loaded into memory *once* globally, avoiding massive RAM bottlenecks for concurrent video requests. 

### Step 3: Frame Extraction & Asynchronous Producer-Consumer Target
Using `OpenCV`, the system isolates frames using the user's `fps_sample` preference. 
Instead of waiting for YOLO to analyze Frame 1 before grabbing Frame 2, the pipeline uses **ThreadPoolExecutor (max_workers=3)** as a producer:
*   **Producer:** `detector.detect()` evaluates frames asynchronously ahead of the tracker.
*   **Consumer:** A bounded window queue of size `4` catches YOLO's completed future objects dynamically, feeding the detection maps sequentially into the tracking engine to avoid corrupting velocity vectors over time.

### Step 4: Event Heuristics (Analytics Engine)
Every tracked frame is run concurrently through specific classes:
*   **Weapon Detector:** Identifies knives or firearms and assigns them "HIGH" severity.
*   **Loitering Detector:** If an object (Track ID) remains within a bounded region pixel threshold for `X` seconds, it triggers a "MEDIUM" severity loitering alert.
*   **Restricted Zone Detector:** Evaluates whether coordinates overlap with an imaginary restricted polygon (e.g., left 30% of the screen).
*   **Suspicious Activity Detector:** Uses background subtraction and bounding-box history to identify rapid motion spikes, abandoned baggage, or unknown entity anomalies. 

### Step 5: Optimization & Narrative Construction
*   **Optimizer:** Eliminates large swaths of "empty" frames where no events occurred, effectively shrinking the video output to a highlight reel.
*   **LLM Summarizer:** The event timeline and metrics are compiled into a prompt, passing through an AI LLM to construct a readable text narrative (e.g., "At 00:15, an unidentified perimeter breach was recorded...").

### Step 6: Return Payload
The backend dumps the final compressed video into the `outputs/` folder and packages the Events array, LLM text, and statistical compression metrics into a JSON map resolving back to the React UI.

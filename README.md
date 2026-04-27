# 🛡️ HomeShield AI

**HomeShield AI (formerly ClearView AI)** is an advanced, privacy-first Video Summarization & Surveillance platform. The system processes continuous video data locally using state-of-the-art edge AI to intelligently audit footage, extract anomalies (such as weapons, loitering, and restricted zone breaches), and generate highly-compressed highlight reels and text narratives.

## 🌟 Live Demo
**Check out the live demo here:** [https://homeshield-ai-seven.vercel.app](https://homeshield-ai-seven.vercel.app)

---

## 📖 Table of Contents
- [Motivation](#-motivation)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Future Scope](#-future-scope)

---

## 🎯 Motivation
The rapid adoption of home surveillance systems has led to a massive influx of continuous video data. Manually reviewing hours of normal footage to find a single anomaly is labor-intensive and inefficient. 

Current cloud-based solutions require high bandwidth, induce latency, and pose severe privacy and cost concerns. HomeShield AI addresses this by providing a **fully localized, CPU-optimized solution** using the latest **YOLOv11** architecture, capable of detecting objects and behavioral anomalies without leaving the user's local network.

---

## ✨ Key Features
- **Weapon Detection:** Utilizes bounding-box intersection logic to detect if a person is holding a weapon, triggering a HIGH severity alert.
- **Loitering Detection:** Relies on persistent temporal tracking. Flags a MEDIUM severity alert if a person remains in the camera frame for more than 8 seconds.
- **Restricted Zones:** Validates if coordinates overlap with specific screen polygons.
- **MOHASA Optimizer:** A simulated annealing-inspired approach that assigns "Importance Scores" to frames, effectively reducing video size by 80-90% while retaining 100% of the threat payload.
- **Highlight Reels & Narrative Reports:** Stitches final frames into a compressed `.mp4` and builds an AI-generated readable text narrative.

---

## 🛠 Tech Stack

### Frontend Client
- **Core Framework:** React 18+ (using Vite)
- **Styling:** Tailwind CSS (Dark-themed, dynamic UI)
- **Authentication & DB:** Firebase Authentication & Firestore (history logs)
- **Icons & API:** Lucide-React, Axios

### Backend Inference Engine
- **Core Framework:** FastAPI (Asynchronous API server)
- **Computer Vision:** OpenCV (cv2) for frame extraction and video stitching
- **Object Detection Models:** YOLOv11m (Medium variant) for localized, CPU-optimized edge detection
- **Summarization Tools:** MoviePy (video compression) and LLM wrappers

### DevOps & Deployment
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes (k8s)
- **CI/CD:** Jenkins

---

## 🏗 System Architecture

The architecture consists of a decoupled Backend (FastAPI + OpenCV + PyTorch) and Frontend (React + Tailwind).

1. **Extraction:** OpenCV isolates frames based on the requested FPS mode.
2. **Detection & Tracking (YOLOv11):** Bounding boxes, confidence scores, and centroid trackers (to maintain entity identities across timestamps) are applied.
3. **Event Heuristics Applied:** Sub-modules analyze spatial relationships over time to detect anomalies.
4. **Packaging:** The Optimizer patches together the flagged frames, constructs an LLM text narrative, and resolves a JSON payload back to the React UI containing all arrays, logs, and video locations.
5. **Asynchronous Processing:** `ThreadPoolExecutor` and `ProcessPoolExecutor` are used for parallel processing and video compression, ensuring the API remains highly responsive.

---

## ⚙️ How It Works

### Why YOLOv11 was Chosen
YOLOv11m represents the absolute state-of-the-art in real-time object detection. It was chosen over YOLOv8 because of improved feature extraction for smaller objects (like knives) and its CPU viability (balancing Mean Average Precision and inference speed on a standard Intel CPU without OOM issues).

### Global Thread-Safe Initialization
The `ObjectDetector` is initialized via a Singleton pattern. YOLOv11m is loaded into memory only *once* globally, avoiding RAM bottlenecks when handling multiple or concurrent video uploads.

---

## 🚀 Future Scope
1. **Multi-Camera Feeds:** Utilizing multi-threading to process streams from 4-8 cameras simultaneously.
2. **GPU Acceleration:** Shifting from CPU logic to CUDA blocks for real-time 30FPS throughput.
3. **Facial Recognition:** Adding DeepFace to match intruders against known trusted faces.

---
*“Turning logical requirements into functional solutions.”*

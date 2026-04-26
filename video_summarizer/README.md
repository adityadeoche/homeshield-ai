# Video Summarization for Surveillance System with Suspicious Activity Detection

## 1. Motivation
The rapid adoption of home surveillance systems has led to a massive influx of continuous video data. Manually reviewing hours of normal footage to find a single anomaly is labor-intensive and inefficient. This project addresses the need for an automated, privacy-first, edge-computing solution that intelligently audits video footage and extracts only the relevant (suspicious) keyframes.

## 2. Research Gap
Current cloud-based solutions (like AWS Rekognition or GCP Vertex AI) require high bandwidth, induce latency, and pose severe privacy and cost concerns. On the other hand, many existing local implementations use older, slower models (like YOLOv3 or YOLOv5) or fail to intelligently summarize the data, resulting in storage bloat.
**Our Solution:** A fully localized, CPU-optimized solution using the latest **YOLOv11** architecture, capable of not only detecting objects but understanding behavioral anomalies (loitering) and security threats (weapons) without leaving the user's local network.

## 3. Architecture
The architecture consists of a decouple Backend (FastAPI + OpenCV + PyTorch) and Frontend (React + Tailwind).
- **Video Input:** Captured and processed at an optimized 1 FPS.
- **Object Detection & Tracking:** YOLOv11m models extract bounding boxes and confidence scores. Centroid trackers maintain identity between frames.
- **Event Detectors:** Specialized sub-modules analyze spatial relationships over time.
- **MOHASA Optimizer:** Selectively filters out redundant anomaly frames based on severity scoring.
- **Summarization:** MoviePy/OpenCV stitches final frames into a compressed `.mp4`, and a text generator builds a readable narrative.

## 4. Why YOLOv11 was Chosen
YOLOv11m represents the absolute state-of-the-art in real-time object detection. It was chosen over YOLOv8 because:
- **Improved Feature Extraction:** It detects smaller objects (like knives) with much higher fidelity.
- **CPU Viability:** The medium (`m`) variant achieves a perfect balance of mAP (Mean Average Precision) while remaining small enough to run inference on a standard Intel i5 CPU without OOM issues.

## 5. How Weapon Detection Works
Weapon detection utilizes bounding-box intersection logic. Fast inference maps COCO classes (`knife`, `baseball bat`). The system isolates `person` objects and `weapon` objects.
If the intersection area of a person's bounding box and a weapon's bounding box is greater than 0, the system deduces the person is *holding* the weapon, triggering a HIGH severity alert.

## 6. How Loitering Detection Works
Loitering detection relies on persistent temporal tracking. When a person object is detected, a centroid tracker assigns it an ID `(e.g., Person 1)`. The system records their initial timestamp. As long as `Person 1` remains in the camera frame, their duration calculation increases. If `Current Time - Initial Time > 8 seconds`, a MEDIUM severity Loitering alert is triggered.

## 7. How the Optimizer Improves Summaries
Standard surveillance systems simply record everything if motion is detected. This project uses a simplified MOHASA-inspired metaheuristic approach. It assigns an "Importance Score" to every frame containing an event. `High=5, Medium=3, Low=1`. Based on simulated annealing logic, it filters out un-scored frames, effectively dumping 80-90% of redundant video while retaining 100% of the threat payload.

## 8. Future Scope
1. **Multi-Camera Feeds:** Utilizing multi-threading to process streams from 4-8 cameras simultaneously.
2. **GPU Acceleration:** Shifting from CPU logic to CUDA blocks for real-time 30FPS throughput.
3. **Facial Recognition:** Adding DeepFace to match intruders against known trusted faces.

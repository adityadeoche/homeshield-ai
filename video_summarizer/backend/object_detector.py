from ultralytics import YOLO
import os
import urllib.request
import cv2

import torch

class ObjectDetector:
    def __init__(self):
        # 🎯 OBJECT DETECTION MODEL (MANDATORY) - Use latest Ultralytics YOLOv11m
        self.model_path = "models/yolov11m.pt"
        if not os.path.exists("models"):
            os.makedirs("models")
            
        if not os.path.exists(self.model_path):
            print("Downloading YOLOv11m.pt model...")
            urllib.request.urlretrieve("https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11m.pt", self.model_path)
            
        print("Loading local YOLO model...")
        self.model = YOLO(self.model_path)
        
    def detect_batch(self, frames, conf_threshold=0.20):
        """ Runs YOLOv11m on a batch of frames using GPU and ByteTrack tracking """
        device_choice = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Batch inference with ByteTrack
        results = self.model.track(
            frames, 
            verbose=False, 
            device=device_choice, 
            imgsz=640, 
            conf=conf_threshold,
            persist=True,
            tracker="bytetrack.yaml"
        )
        
        batch_detections = []
        for r in results:
            detections = []
            if r.boxes:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    cls = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    name = self.model.names[cls]
                    track_id = int(box.id[0].item()) if box.id is not None else -1
                    
                    detections.append({
                        "bbox": [x1, y1, x2, y2],
                        "class_name": name,
                        "confidence": conf,
                        "track_id": track_id
                    })
            batch_detections.append(detections)      
        return batch_detections

    def detect(self, frame, conf_threshold=0.20):
        """ Single frame detection wrapper """
        return self.detect_batch([frame], conf_threshold)[0]

    def annotate(self, frame, tracked_objects):
        """ Draws bounding boxes over detected suspicious objects for clarity """
        for obj in tracked_objects:
            x1, y1, x2, y2 = map(int, obj["bbox"])
            name = obj["class_name"]
            
            # Optional UI bounding boxes for final keyframes
            color = (0, 0, 255) if name in ["knife", "baseball bat", "scissors"] else (255, 0, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{name} {obj.get('track_id', '?')}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        return frame

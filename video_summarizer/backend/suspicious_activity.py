import cv2
import numpy as np

class RestrictedZoneDetector:
    def __init__(self, threshold=3, zone_limit=0.3):
        self.threshold = threshold
        self.zone_limit = zone_limit
        self.zone_entry_times = {}
        self.triggered_ids = set()
        
    def in_restricted_zone(self, cx, cy, width, height):
        # We define a restricted entrance zone manually.
        if cx < width * self.zone_limit:
            return True
        return False
        
    def check(self, tracked_objects, timestamp, width, height):
        events = []
        current_ids = set()
        
        for obj in tracked_objects:
            if obj["class_name"] == "person":
                tid = obj["track_id"]
                current_ids.add(tid)
                
                bx = obj["bbox"]
                cx, cy = (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2
                
                if self.in_restricted_zone(cx, cy, width, height):
                    if tid not in self.zone_entry_times:
                        self.zone_entry_times[tid] = timestamp
                    else:
                        duration = timestamp - self.zone_entry_times[tid]
                        if duration > self.threshold:
                            if tid not in self.triggered_ids:
                                events.append({
                                    "event_type": "Restricted Area Intrusion",
                                    "type": "Restricted Area Intrusion",
                                    "severity": "HIGH",
                                    "timestamp": timestamp,
                                    "description": "A person breached the restricted entrance zone.",
                                    "confidence": round(float(obj.get("confidence", 0.90)), 2)
                                })
                                self.triggered_ids.add(tid)
                else:
                    if tid in self.zone_entry_times:
                        del self.zone_entry_times[tid]
                    if tid in self.triggered_ids:
                        self.triggered_ids.remove(tid)
                        
        # cleanup
        for tid in list(self.zone_entry_times.keys()):
             if tid not in current_ids:
                 del self.zone_entry_times[tid]
                 if tid in self.triggered_ids:
                     self.triggered_ids.remove(tid)
                     
        return events


class SuspiciousActivityDetector:
    def __init__(self, adaptive_threshold=2000000, zone_limit=0.3):
        self.prev_frame_gray = None
        self.adaptive_threshold = adaptive_threshold
        self.zone_limit = zone_limit
        
        self.object_history = [] 
        self.common_classes = {"person", "car", "chair", "table", "potted plant", "dog", "cat", "bird"} # Common non-suspicious objects
        
    def check_motion(self, frame, timestamp):
        events = []
        
        # Resize frame for faster motion computation math
        small_frame = cv2.resize(frame, (320, 240))
        gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        if self.prev_frame_gray is not None:
            # Frame difference formula
            frame_delta = cv2.absdiff(self.prev_frame_gray, gray)
            motion_score = np.sum(frame_delta)
            
            # Dynamic thresholding based on average pixel intensity to prevent false positives in bright/dark
            avg_intensity = np.mean(self.prev_frame_gray)
            dynamic_thresh = max(self.adaptive_threshold, avg_intensity * 320 * 240 * 0.4)
            
            if motion_score > dynamic_thresh:
                events.append({
                    "event_type": "Abnormal Motion Activity",
                    "type": "Abnormal Motion Activity",
                    "severity": "LOW",
                    "timestamp": timestamp,
                    "description": "Unusual sudden motion was detected in the camera view.",
                    "confidence": round(min(0.99, float(motion_score) / (float(dynamic_thresh) * 2.0)), 2)
                })
        
        self.prev_frame_gray = gray
        return events

    def check_objects(self, tracked_objects, timestamp, width, height):
        events = []
        current_classes = set(obj["class_name"] for obj in tracked_objects)
        
        # Keep last 5 frames history
        self.object_history.append(current_classes)
        if len(self.object_history) > 5:
            self.object_history.pop(0)
            
        # All classes in previous frames
        past_classes = set().union(*self.object_history[:-1]) if len(self.object_history) > 1 else set()
        
        for obj in tracked_objects:
            cls = obj["class_name"]
            
            # Unknown Object Placement logic
            if cls not in self.common_classes and cls not in past_classes and len(self.object_history) > 1:
                bx = obj["bbox"]
                cx, cy = (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2
                
                # Use dynamic zone limit
                if cx < width * self.zone_limit:
                    events.append({
                        "event_type": "Suspicious Object Placement",
                        "type": "Suspicious Object Placement",
                        "severity": "MEDIUM",
                        "timestamp": timestamp,
                        "description": f"A suspicious unknown object ({cls}) was detected near the restricted zone.",
                        "confidence": round(float(obj.get("confidence", 0.85)), 2)
                    })
                    # Add to common so it doesn't repeatedly trigger every frame
                    self.common_classes.add(cls)
                    
        return events

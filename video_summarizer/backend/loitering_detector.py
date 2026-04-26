class LoiteringDetector:
    def __init__(self, loiter_threshold=5, displacement_threshold=50.0):
        self.loiter_threshold = loiter_threshold  # in seconds
        self.displacement_threshold = displacement_threshold # pixels
        self.track_data = {}
        self.triggered_ids = set()
        
    def check(self, tracked_objects, timestamp):
        events = []
        current_ids = set()
        
        for obj in tracked_objects:
            if obj["class_name"] == "person":
                tid = obj["track_id"]
                current_ids.add(tid)
                
                bx = obj["bbox"]
                cx, cy = (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2
                
                if tid not in self.track_data:
                    self.track_data[tid] = {"entry_time": timestamp, "entry_cx": cx, "entry_cy": cy}
                else:
                    data = self.track_data[tid]
                    duration = timestamp - data["entry_time"]
                    
                    displacement = ((cx - data["entry_cx"])**2 + (cy - data["entry_cy"])**2)**0.5
                    
                    # Loitering logic: Present for >= 5 seconds AND hasn't moved far from entry origin
                    if duration >= self.loiter_threshold and displacement < self.displacement_threshold:
                        if tid not in self.triggered_ids:
                            events.append({
                                "event_type": "Loitering Detected",
                                "type": "Loitering Detected",
                                "severity": "MEDIUM",
                                "timestamp": timestamp,
                                "description": "A person was detected loitering in the area for a prolonged period.",
                                "confidence": round(float(obj.get("confidence", 0.85)), 2)
                            })
                            self.triggered_ids.add(tid)
                            
        # Cleanup disconnected tracks
        for tid in list(self.track_data.keys()):
            if tid not in current_ids:
                del self.track_data[tid]
                if tid in self.triggered_ids:
                    self.triggered_ids.remove(tid)
                    
        return events

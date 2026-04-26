import math

class ObjectTracker:
    def __init__(self):
        """ Performs centroid-based tracking across frames """
        self.next_id = 1
        self.active_tracks = {}
        
    def update(self, detections):
        tracked_objects = []
        current_centroids = []
        
        # Compute centroids for all CURRENT detections
        for det in detections:
            bbox = det["bbox"]
            cx = (bbox[0] + bbox[2]) / 2
            cy = (bbox[1] + bbox[3]) / 2
            current_centroids.append((cx, cy, det))
            
        new_tracks = {}
        
        for cx, cy, det in current_centroids:
            matched_id = None
            min_dist = float('inf')
            
            # Find the closest previous track
            for track_id, track_data in self.active_tracks.items():
                tcx, tcy = track_data["centroid"]
                dist = math.hypot(cx - tcx, cy - tcy)
                
                # Distance threshold for matching identity between frames at 1 FPS 
                # Needs to be a bit large (e.g. 150 pixels) due to skipped frames
                if dist < 150 and dist < min_dist:
                    min_dist = dist
                    matched_id = track_id
                    
            if matched_id is not None:
                new_tracks[matched_id] = {
                    "centroid": (cx, cy),
                    "frames_counted": self.active_tracks[matched_id]["frames_counted"] + 1
                }
                del self.active_tracks[matched_id] # consume the track so it's a 1:1 match
            else:
                # new object
                new_tracks[self.next_id] = {
                    "centroid": (cx, cy),
                    "frames_counted": 1
                }
                matched_id = self.next_id
                self.next_id += 1
                
            det_with_id = det.copy()
            det_with_id["track_id"] = matched_id
            tracked_objects.append(det_with_id)
            
        # Update active tracks state for next frame
        self.active_tracks = new_tracks
        return tracked_objects

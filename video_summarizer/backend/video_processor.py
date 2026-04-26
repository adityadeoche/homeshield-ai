import cv2
import os
import time
import concurrent.futures
from backend.object_detector import ObjectDetector
from backend.object_tracker import ObjectTracker
from backend.weapon_detector import WeaponDetector
from backend.loitering_detector import LoiteringDetector
from backend.suspicious_activity import SuspiciousActivityDetector, RestrictedZoneDetector
from backend.keyframe_selector import KeyframeSelector
from backend.optimizer import Optimizer
from backend.summarizer import Summarizer

GLOBAL_DETECTOR = None

def get_detector():
    global GLOBAL_DETECTOR
    if GLOBAL_DETECTOR is None:
        GLOBAL_DETECTOR = ObjectDetector()
    return GLOBAL_DETECTOR

def process_video(video_path, output_dir, confidence=0.20, fps_sample=1, summary_length="Medium", zone_limit=0.3):
    print(f"Loading Models & Initializing Modules for {video_path}...")
    start_time = time.time()
    
    try:
        # Initialize Core Modules
        detector = get_detector()
        # tracker = ObjectTracker() # Removed in favor of YOLO ByteTrack natively
        
        # Initialize Event Detectors
        weapon_detector = WeaponDetector()
        loitering_detector = LoiteringDetector(loiter_threshold=5, displacement_threshold=50.0) 
        activity_detector = SuspiciousActivityDetector(zone_limit=zone_limit)
        restricted_zone_detector = RestrictedZoneDetector(threshold=3, zone_limit=zone_limit)
        
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0 or fps != fps:
            fps = 30
            
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Total Video Frames: {total_frames} @ {fps} FPS")    
    
        frame_count = 0
        events = []
        keyframes = []
        
        # Process at user requested FPS
        frame_skip = int(fps / float(fps_sample)) if float(fps_sample) > 0 else int(fps)
        if frame_skip == 0: frame_skip = 1
        
        print(f"Starting processing pipeline ({fps_sample} FPS CPU/GPU Batch Mode)...")
        
        batch_frames = []
        batch_ts = []
        
        def process_analytics(batch_timestamps, batch_frames_list, batch_detections):
            for i, detections in enumerate(batch_detections):
                ts = batch_timestamps[i]
                frm = batch_frames_list[i]
                
                # 2. Object Tracking (now provided natively via YOLO detections ByteTrack)
                tracked_objects = detections
                
                # 3. Detect Highly Suspicious Events
                weapon_events = weapon_detector.check(tracked_objects, ts)
                loitering_events = loitering_detector.check(tracked_objects, ts)
                zone_events = restricted_zone_detector.check(tracked_objects, ts, width, height)
                motion_events = activity_detector.check_motion(frm, ts)
                object_events = activity_detector.check_objects(tracked_objects, ts, width, height)
                
                current_events = weapon_events + loitering_events + zone_events + motion_events + object_events
                if current_events:
                    # Add Zone Map Location approximations
                    zone_assignment = "P1"
                    if tracked_objects:
                        bx = tracked_objects[0]["bbox"]
                        cx, cy = (bx[0]+bx[2])/2, (bx[1]+bx[3])/2
                        if cx < width/2 and cy < height/2: zone_assignment = "P1"
                        elif cx >= width/2 and cy < height/2: zone_assignment = "P2"
                        elif cx < width/2 and cy >= height/2: zone_assignment = "P3"
                        else: zone_assignment = "P4"
                    
                    for ev in current_events:
                        ev["zone"] = zone_assignment
                        
                    events.extend(current_events)
                    # Save keyframe bounding boxes for events
                    annotated_frame = detector.annotate(frm.copy(), tracked_objects)
                    keyframes.append((ts, annotated_frame))
    
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % frame_skip == 0:
                timestamp = frame_count / fps
                batch_frames.append(frame.copy())
                batch_ts.append(timestamp)
                
                if len(batch_frames) == 4:
                    print(f"Processing batch of 4 frames at {timestamp:.2f}s")
                    batch_detections = detector.detect_batch(batch_frames, float(confidence))
                    process_analytics(batch_ts, batch_frames, batch_detections)
                    batch_frames.clear()
                    batch_ts.clear()
                    
            frame_count += 1
            
        cap.release()
        
        # Dispatch remaining partial batch
        if batch_frames:
            print(f"Processing final partial batch of {len(batch_frames)} frames")
            batch_detections = detector.detect_batch(batch_frames, float(confidence))
            process_analytics(batch_ts, batch_frames, batch_detections)
            batch_frames.clear()
            batch_ts.clear()
        
        print("Processing Pipeline complete.")
        
        # 4. Keyframe Extraction & Filtering
        selector = KeyframeSelector()
        selected_frames = selector.select(keyframes)
        
        # 5. Simulated MOHASA-inspired Optimization
        optimizer = Optimizer()
        final_frames, summary_stats = optimizer.optimize(selected_frames, events, start_time, summary_length, fps_sample, total_frames=total_frames)
        
        # 6. Summary Generation (Video + Text Summarization)
        summarizer = Summarizer()
        
        # Give a guaranteed unique filename
        stamp = int(time.time())
        video_filename = f"{os.path.splitext(os.path.basename(video_path))[0]}_{stamp}.mp4"
        
        summary_video_path, text_summary = summarizer.generate(final_frames, events, output_dir, video_filename)
        
        return {
            "summary_video": f"/outputs/{os.path.basename(summary_video_path)}" if summary_video_path else None,
            "text_summary": text_summary,
            "stats": summary_stats,
            "events": events
        }
        
    except Exception as e:
        import traceback
        print(f"Critical error in video_processor: {e}")
        traceback.print_exc()
        try:
            if 'cap' in locals(): cap.release()
        except:
            pass
        raise e

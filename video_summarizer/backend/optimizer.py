import time

class Optimizer:
    def optimize(self, keyframes, events, start_time, summary_length="Medium", fps_sample=1, total_frames=300):
        """ 
        Simulate MOHASA-inspired optimization (Metaheuristic Optimization) 
        Assign importance score based on event severity near the frame 
        """
        optimized_frames = []
        last_added_ts = -10
        
        gap_threshold = 2
        if summary_length == "Short": gap_threshold = 4
        elif summary_length == "Long": gap_threshold = 0.5
        
        for ts, frame in keyframes:
            score = 0
            
            # Simulated annealing style score bumping for important time intervals
            for e in events:
                if abs(e["timestamp"] - ts) <= 2: 
                    score += 5 if e["severity"] == "HIGH" else 3 if e["severity"] == "MEDIUM" else 1
            
            # Keep frames that pass the score threshold
            if score >= 1:
                # Remove redundancy: only keep frame if at least N seconds passed since last addition
                # UNLESS it is a HIGH severity frame (score >= 5).
                if score >= 5 or (ts - last_added_ts) >= gap_threshold:
                    optimized_frames.append((ts, frame))
                    last_added_ts = ts
                
        # Deduplicate & Sort by time
        optimized_frames.sort(key=lambda x: x[0])
        
        # Calculate performance metrics
        end_time = time.time()
        process_time = end_time - start_time
        
        # Compression Ratio: Summary Frames vs Raw Frames tracked
        total_tracked = max(1, total_frames) 
        c_ratio = f"{max(0, 100 - (len(optimized_frames) / total_tracked) * 100):.1f}%"
        
        stats = {
            "compression_ratio": c_ratio,
            "fps": f"{fps_sample} FPS (User Set)",
            "suspicious_count": len(events),
            "total_keyframes": len(optimized_frames),
            "processing_time": f"{process_time:.1f}s"
        }
        
        return optimized_frames, stats

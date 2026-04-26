import cv2
import os
from moviepy.video.io.ImageSequenceClip import ImageSequenceClip

class Summarizer:
    def format_time(self, seconds):
        m = int(seconds // 60)
        s = int(seconds % 60)
        return f"{m:02d}:{s:02d}"

    def generate(self, final_frames, events, output_dir, video_filename="summary.mp4"):
        """ 1. Generates Summary Video, 2. Generates Text Summary """
        
        base_name = os.path.splitext(video_filename)[0]
        video_path = os.path.join(output_dir, f"{base_name}_summary.mp4")
        
        if final_frames:
            # --- 1. Generate Video from keyframes ---
            print(f"MoviePy: Writing MP4 summary to {video_path}")
            # Convert OpenCV BGR to RGB for MoviePy
            rgb_frames = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for ts, frame in final_frames]
            clip = ImageSequenceClip(rgb_frames, fps=1)
            # Use libx264 codec to ensure complete web browser compatibility (H.264)
            clip.write_videofile(video_path, codec="libx264", audio=False)
            output_video = video_path
        else:
            # Fallback blank
            output_video = None
            
        # --- 2. Generate Readable Text Summary ---
        text_lines = []
        events.sort(key=lambda x: x["timestamp"])
        
        last_event_type = None
        last_event_time = -10
        
        for e in events:
            # Remove redundancy: skip describing the exact same event if it happens repeatedly in short succession
            if e["type"] == last_event_type and (e["timestamp"] - last_event_time) < 10:
                continue
                
            time_str = self.format_time(e["timestamp"])
            desc = str(e["description"]).lower().strip(".")
            confidence = e.get("confidence", 0.90)
            
            text_lines.append(f"[{time_str}] {e['severity']} (Conf {int(confidence*100)}%): {desc}.")
            
            last_event_type = e["type"]
            last_event_time = e["timestamp"]
                
        raw_text_summary = "\n".join(text_lines)
        text_summary = raw_text_summary.replace("\n", " ") if raw_text_summary else ""
        
        if raw_text_summary:
            try:
                import google.generativeai as genai
                api_key = os.environ.get("GEMINI_API_KEY")
                if api_key:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    prompt = f"Convert these surveillance security events into a concise, professional incident report paragraph suitable for security personnel. Keep it brief. Events:\n{raw_text_summary}"
                    response = model.generate_content(prompt)
                    if response.text:
                        text_summary = response.text.strip()
            except Exception as e:
                print(f"LLM Summarization skipped/failed: {e}")
                text_summary = ". ".join(s.capitalize() for s in text_summary.split(". "))
        else:
            text_summary = "Video processed successfully. Routine activity observed with no explicit threats."
            
        return output_video, text_summary

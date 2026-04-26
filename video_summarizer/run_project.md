# How to Run the Project (Local CPU Execution)

## Prerequisites
- Minimum Hardware: Intel i5, 8GB RAM
- Software: Python 3.9+, Node.js (v18+)

## 1. Setup the Backend (FastAPI / AI Pipeline)
1. Open a new terminal.
2. Navigate to the backend root directory:
   `cd video_summarizer`
3. Install the AI dependencies (this may take 5-10 minutes due to PyTorch):
   `pip install -r requirements.txt`
4. Start the FastAPI server:
   `uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload`
   
*(Note: On the first run, the system will automatically download the 40MB YOLOv11m weights from Github into the `/models` directory).*

## 2. Setup the Frontend (React / Tailwind UI)
1. Open a **second** terminal.
2. Navigate to the frontend directory:
   `cd video_summarizer/frontend`
3. Install the dependencies:
   `npm install`
4. Start the development server:
   `npm run dev` (or `npm start` depending on Vite mapping)
   
## 3. Usage
- Open your browser to `http://localhost:3000` (or whichever port Vite gives you).
- Upload a standard `.mp4` surveillance clip.
- Wait for the pipeline to finish processing. Watch the terminal running uvicorn to see the real-time frame-by-frame CPU analysis!

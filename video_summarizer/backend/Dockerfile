FROM python:3.11-slim

# System deps for OpenCV + MoviePy
RUN apt-get update && apt-get install -y \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 ffmpeg wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY video_summarizer/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --default-timeout=1000 --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Pre-bake YOLO model into image (avoids runtime download)
RUN mkdir -p models && \
    wget -q -O models/yolov11m.pt \
    https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11m.pt

# Copy backend source
COPY video_summarizer/backend ./backend

# Create I/O directories
RUN mkdir -p uploads outputs

EXPOSE 8001

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8001"]

# Use the official Ultralytics image as base (contains YOLO, PyTorch, and all dependencies)
FROM ultralytics/ultralytics:latest

# Create a non-root user for Hugging Face Spaces (required)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy the backend code into the app directory
COPY --chown=user . .

# Install any additional requirements
RUN pip install --no-cache-dir fastapi uvicorn python-multipart moviepy google-generativeai

# Create necessary directories
RUN mkdir -p uploads outputs

# Expose the port (Hugging Face uses 7860 by default)
EXPOSE 7860

# Command to run the application
# We use 0.0.0.0 to make it accessible outside the container
CMD ["uvicorn", "video_summarizer.backend.app:app", "--host", "0.0.0.0", "--port", "7860"]

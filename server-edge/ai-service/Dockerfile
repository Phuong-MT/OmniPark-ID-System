FROM python:3.11-slim

WORKDIR /app

# Bổ sung các thư viện hệ thống bắt buộc cho OpenCV và PaddlePaddle trên ARM64
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV NNPACK_DISABLE=1
ENV TORCH_CPP_MIN_LOG_LEVEL=3

COPY requirements.txt .

RUN pip install --default-timeout=100 --no-cache-dir --upgrade pip && \
    pip install --default-timeout=100 --no-cache-dir torch torchvision && \
    # Cài đặt riêng onnxruntime và opencv bản headless để chạy mượt trên docker slim
    pip install --default-timeout=100 --no-cache-dir opencv-python-headless==4.9.0.80 onnxruntime==1.17.0 && \
    pip install --default-timeout=100 --no-cache-dir -r requirements.txt

COPY src/ src/
COPY *.pt .
COPY *.onnx .

ENV PYTHONPATH=/app

CMD ["python", "src/main.py"]
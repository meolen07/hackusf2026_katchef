FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY ai ./ai

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000}"]

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

# Runs Flask API and starts Kafka worker thread from app.py
CMD ["python", "app.py"]

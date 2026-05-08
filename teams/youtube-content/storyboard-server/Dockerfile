FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py /app/server.py
COPY index.html /app/index.html
COPY picker.html /app/picker.html
COPY generate-budget-report.py /app/generate-budget-report.py

ENV PROJECTS_DIR=/projects \
    BIND_HOST=0.0.0.0 \
    PORT=8500 \
    PYTHONUNBUFFERED=1

EXPOSE 8500

CMD ["gunicorn", "--bind", "0.0.0.0:8500", "--workers", "2", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "server:app"]

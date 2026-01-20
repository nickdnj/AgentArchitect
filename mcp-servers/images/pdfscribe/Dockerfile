# PDFScribe MCP Server
# Transcribes PDFs using GPT-4o vision

FROM python:3.12-slim

# Install system dependencies (poppler for pdf2image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the pdfscribe_cli tool
COPY pdfscribe_cli/ /app/pdfscribe_cli/

# Copy the MCP server
COPY pdfscribe_server.py .

# Create workspace directories
RUN mkdir -p /workspace /outputs

# Environment variables
ENV PDFSCRIBE_CLI_PATH=/app/pdfscribe_cli
ENV PDFSCRIBE_WORKSPACE=/workspace
ENV PDFSCRIBE_OUTPUT=/outputs
ENV PYTHONUNBUFFERED=1

# Run the MCP server
CMD ["python", "pdfscribe_server.py"]

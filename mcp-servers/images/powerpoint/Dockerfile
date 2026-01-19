# PowerPoint MCP Server Docker Image
# Uses python-pptx for PowerPoint creation

FROM python:3.10-alpine

# Install system dependencies for python-pptx
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    jpeg-dev \
    zlib-dev \
    libpng-dev

# Security: Run as non-root user
RUN addgroup -g 1001 mcp && \
    adduser -u 1001 -G mcp -s /bin/sh -D mcp

# Create directories for templates and workspace
RUN mkdir -p /mcp/templates /mcp/workspace && \
    chown -R mcp:mcp /mcp

WORKDIR /mcp

# Install Python dependencies
RUN pip install --no-cache-dir \
    mcp \
    python-pptx \
    Pillow \
    fonttools

# Copy the server script
COPY --chown=mcp:mcp ppt_server.py /mcp/ppt_server.py

# Copy entrypoint script
COPY --chown=mcp:mcp entrypoint.sh /mcp/entrypoint.sh
RUN chmod +x /mcp/entrypoint.sh

USER mcp

# Default environment variables
ENV PPT_TEMPLATE_PATH=/mcp/templates
ENV PPT_WORKSPACE_PATH=/mcp/workspace

ENTRYPOINT ["/mcp/entrypoint.sh"]

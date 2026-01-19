# Google Drive MCP Server Docker Image
# Uses @isaacphi/mcp-gdrive for Google Drive and Sheets access

FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 mcp && \
    adduser -u 1001 -G mcp -s /bin/sh -D mcp

# Create directories for credentials (will be mounted from host)
RUN mkdir -p /mcp/credentials && \
    chown -R mcp:mcp /mcp

WORKDIR /mcp

# Install the GDrive MCP server globally
RUN npm install -g @isaacphi/mcp-gdrive@0.2.0

# Copy entrypoint script
COPY --chown=mcp:mcp entrypoint.sh /mcp/entrypoint.sh
RUN chmod +x /mcp/entrypoint.sh

USER mcp

# Default environment variables (overridable via docker run -e)
ENV GDRIVE_CREDS_DIR=/mcp/credentials

ENTRYPOINT ["/mcp/entrypoint.sh"]

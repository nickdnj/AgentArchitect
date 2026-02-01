# Google Tasks MCP Server Docker Image
# Uses @brandcast_app/google-tasks-mcp for Google Tasks API access

FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 mcp && \
    adduser -u 1001 -G mcp -s /bin/sh -D mcp

# Create directories for credentials
RUN mkdir -p /mcp/credentials && \
    chown -R mcp:mcp /mcp

WORKDIR /mcp

# Install the Google Tasks MCP server globally
RUN npm install -g @brandcast_app/google-tasks-mcp@0.1.0

# Copy entrypoint script
COPY --chown=mcp:mcp entrypoint.sh /mcp/entrypoint.sh
RUN chmod +x /mcp/entrypoint.sh

USER mcp

ENTRYPOINT ["/mcp/entrypoint.sh"]

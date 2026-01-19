# Gmail MCP Server Docker Image
# Uses @gongrzhe/server-gmail-autoauth-mcp for Gmail API access

FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 mcp && \
    adduser -u 1001 -G mcp -s /bin/sh -D mcp

# Create directories for credentials and the package's expected config location
RUN mkdir -p /mcp/credentials && \
    mkdir -p /home/mcp/.gmail-mcp && \
    chown -R mcp:mcp /mcp /home/mcp

WORKDIR /mcp

# Install the Gmail MCP server globally
RUN npm install -g @gongrzhe/server-gmail-autoauth-mcp@1.1.11

# Copy entrypoint script
COPY --chown=mcp:mcp entrypoint.sh /mcp/entrypoint.sh
RUN chmod +x /mcp/entrypoint.sh

USER mcp

ENTRYPOINT ["/mcp/entrypoint.sh"]

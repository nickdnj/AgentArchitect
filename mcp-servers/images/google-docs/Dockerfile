# Google Docs MCP Server Docker Image
# Uses google-docs-mcp for Google Docs API access

FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 mcp && \
    adduser -u 1001 -G mcp -s /bin/sh -D mcp

# Create working directory
RUN mkdir -p /mcp && chown -R mcp:mcp /mcp

WORKDIR /mcp

# Install the Google Docs MCP server globally
RUN npm install -g google-docs-mcp@1.0.0

# Copy entrypoint script
COPY --chown=mcp:mcp entrypoint.sh /mcp/entrypoint.sh
RUN chmod +x /mcp/entrypoint.sh

USER mcp

ENTRYPOINT ["/mcp/entrypoint.sh"]

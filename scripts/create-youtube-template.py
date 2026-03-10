#!/usr/bin/env python3
"""Create a clean, unbranded YouTube Storyboard PowerPoint template.

Uses python-pptx default layouts which map well to storyboard needs:
  Layout 0: Title Slide — video title and metadata
  Layout 1: Title and Content — chapter overview (agenda) + scene details (workhorse)
  Layout 2: Section Header — chapter dividers
  Layout 3: Two Content — dual content / before-after comparisons
  Layout 5: Title Only — summary slides
  Layout 6: Blank — flexible use
"""

from pptx import Presentation
from pptx.util import Inches
import os
import shutil

prs = Presentation()
prs.slide_width = Inches(13.333)  # 16:9 widescreen
prs.slide_height = Inches(7.5)

# Print available layouts for reference
for i, layout in enumerate(prs.slide_masters[0].slide_layouts):
    print(f"  Layout {i}: {layout.name}")

# Save template
agent_templates = "/Users/nickd/Workspaces/AgentArchitect/agents/presentation/templates"
output_path = os.path.join(agent_templates, "YouTube_Storyboard_TEMPLATE.pptx")
prs.save(output_path)
print(f"\nTemplate saved to: {output_path}")

# Copy to MCP server templates directory
for mcp_dir in [
    "/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/templates",
    "/Users/nickdemarco/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/templates",
]:
    if os.path.isdir(mcp_dir):
        dest = os.path.join(mcp_dir, "YouTube_Storyboard_TEMPLATE.pptx")
        shutil.copy2(output_path, dest)
        print(f"Template copied to: {dest}")
        break
else:
    print("WARNING: MCP server templates directory not found. Copy template manually.")

print("\nLayout mapping for Video Script Writer:")
print("  Layout 0: Title Slide — video title, type, length, date")
print("  Layout 1: Title and Content — chapter overview AND scene detail slides")
print("  Layout 2: Section Header — chapter dividers")
print("  Layout 3: Two Content — before/after, multi-visual comparisons")
print("  Layout 5: Title Only — summary slide (add body text manually)")

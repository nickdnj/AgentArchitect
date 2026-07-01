import os, re

# Wiki review storyboard + every folder that holds embeddable page images.
# Obsidian resolves ![[name.png]] by basename across the vault, so we just need
# each page's **image:** basename to exist in one of these folders.
WIKI = "/Users/nickd/Workspaces/wiki/teams/youtube-content/message-in-the-machine"
sb = os.path.join(WIKI, "storyboard.md")
imgdirs = [
    os.path.join(WIKI, "body-v2"),          # warm-painterly animated body (P4-P32)
    os.path.join(WIKI, "infoage-handout"),  # real InfoAge close images (P32-35 + CTA: antenna/map/QR)
    os.path.join(WIKI, "real"),             # real TRS-80 photos (P14, P17)
]

have = set()
for d in imgdirs:
    if os.path.isdir(d):
        have |= {f for f in os.listdir(d) if f.lower().endswith((".png", ".jpg", ".jpeg"))}

with open(sb) as f:
    lines = f.readlines()

out = []
added = []
img_re = re.compile(r'^\s*-\s\*\*image:\*\*\s+(\S+\.(?:png|jpg|jpeg))')
for i, line in enumerate(lines):
    out.append(line)
    m = img_re.match(line)
    if not m:
        continue
    base = m.group(1).split('/')[-1]
    if base not in have:
        continue
    nxt = lines[i+1] if i+1 < len(lines) else ""   # already embedded -> don't double up
    if f"![[{base}]]" in nxt:
        continue
    indent = re.match(r'^(\s*)', line).group(1)
    out.append(f"{indent}  ![[{base}]]\n")
    added.append(base)

with open(sb, "w") as f:
    f.writelines(out)

print(f"re-added {len(added)} embeds")
for a in added:
    print("  ", a)

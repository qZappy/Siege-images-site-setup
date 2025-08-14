#!/usr/bin/env python3
import os, json, sys
root = sys.argv[1] if len(sys.argv) > 1 else "images"
exts = {".jpg",".jpeg",".png",".webp",".gif"}
data = {"maps": {}}
for m in sorted(os.listdir(root)):
    d = os.path.join(root, m)
    if os.path.isdir(d):
        files = [f for f in sorted(os.listdir(d)) if os.path.splitext(f)[1].lower() in exts]
        if files: data["maps"][m] = files
with open(os.path.join(root,"manifest.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
print("Wrote", os.path.join(root,"manifest.json"))

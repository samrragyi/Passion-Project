#!/usr/bin/env python3
"""
Builds the 15 question icons (icons/q01.webp ... q15.webp) from the original artwork.

The originals are large (2000 x 2000 px, ~5 MB each) and have a solid background
behind the frame. This script:
  1. makes the area OUTSIDE each icon's frame transparent (so it sits cleanly on the page),
  2. crops to the icon's shape so every icon fills its box equally,
  3. shrinks to 256 x 256 px WebP (~10-25 KB each).

Usage (from the repo root):
    pip install pillow numpy scipy
    python3 tools/make_icons.py  /path/to/folder/with/the/original/pngs

To change an icon: put the new original in that folder, edit its filename in SOURCES
below if it changed, run the script, then bump ASSET_VERSION in languages.js.
The original artwork is NOT stored in the repo (only these small web versions are).
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SIZE = 256          # output px (icons are shown at ~72 px, so this is sharp up to 3x screens)
PAD = 0.02          # breathing room around the shape, as a fraction of its size
TOL = 26            # how close to the background colour counts as "background"

# question number -> original file name (matches 15_Ques_Icons.docx)
SOURCES = {
    "q01": "Menstrual_Cycle_Changes_Icon.png",
    "q02": "Hot_Flushes___Night_chills.png",
    "q03": "Brain_Fog.png",
    "q04": "Nerves___Headaches_02.png",
    "q05": "Joins___Muscles.png",
    "q06": "Palpitations_02.png",
    "q07": "Physical_Exhaustion.png",
    "q08": "Skin___Eye_Dryness.png",
    "q09": "Oral___Burning_Tongue.png",
    "q10": "Histamines___Allergies.png",
    "q11": "Anxiety__Dread.png",
    "q12": "Mood_Swings.png",
    "q13": "Disrupted_Sleep_Pattern.png",
    "q14": "Intimate_Discomfort.png",
    "q15": "Urinary_Irritation_01.png",       # bladder + toilet door (default)
    "q15-alt": "Urinary_Irritation.png",      # woman holding her belly (swap by renaming)
}

def make_icon(src_path):
    rgb = np.array(Image.open(src_path).convert("RGB")).astype(np.int16)
    h, w, _ = rgb.shape

    # background colour = median of the outermost pixels
    ring = np.concatenate([rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3),
                           rgb[:, :4].reshape(-1, 3), rgb[:, -4:].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    near_bg = np.abs(rgb - bg).max(axis=2) < TOL

    # a fake "transparent" checkerboard is baked into one of the files: neutral light greys
    neutral = (rgb.max(axis=2) - rgb.min(axis=2) <= 6) & (rgb.min(axis=2) >= 232)
    if (bg.max() - bg.min()) <= 6 and bg.min() >= 232:
        near_bg = near_bg | neutral

    # keep only background regions that touch the image edge (so the inside of the frame survives)
    labels, n = ndi.label(near_bg)
    edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    outside = np.isin(labels, list(edge_labels))
    removed = outside.mean()

    # eat the 2px anti-aliased fringe, then soften the edge a touch
    outside = ndi.binary_dilation(outside, iterations=2)
    alpha = ndi.gaussian_filter((~outside).astype(np.float32), sigma=1.3)
    alpha = np.clip(alpha * 255, 0, 255).astype(np.uint8)

    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    im = Image.fromarray(rgba, "RGBA")

    # crop to the shape, add padding, make square
    ys, xs = np.where(alpha > 128)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    side = int(max(x1 - x0, y1 - y0) * (1 + 2 * PAD))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, (-box[0], -box[1]))
    out = canvas.resize((SIZE, SIZE), Image.LANCZOS)   # Pillow premultiplies alpha when resizing
    return out, removed

def main():
    if len(sys.argv) != 2 or not os.path.isdir(sys.argv[1]):
        sys.exit(__doc__)
    src_dir = sys.argv[1]
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
    os.makedirs(out_dir, exist_ok=True)
    problems = 0
    for name, fname in SOURCES.items():
        path = os.path.join(src_dir, fname)
        if not os.path.exists(path):
            print(f"MISSING  {fname}  (for {name})"); problems += 1; continue
        icon, removed = make_icon(path)
        dest = os.path.join(out_dir, name + ".webp")
        icon.save(dest, "WEBP", quality=90, method=6, alpha_quality=100)
        flag = ""
        if removed < 0.02 or removed > 0.55:
            flag = "   <-- CHECK: unusual amount of background removed"; problems += 1
        print(f"{name:8s} {fname:34s} background removed {removed*100:4.1f}%  ->  {os.path.getsize(dest)//1024:3d} KB{flag}")
    if problems:
        sys.exit(f"\n{problems} problem(s) above.")
    print("\nDone. Remember to bump ASSET_VERSION in languages.js.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Background removal script using rembg.
Usage: python remove_bg.py <input_path> <output_path>
"""
import sys
from rembg import remove
from PIL import Image
import io


def main():
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path, 'rb') as f:
        input_data = f.read()

    output_data = remove(input_data)

    img = Image.open(io.BytesIO(output_data)).convert("RGBA")

    # Crop to non-transparent bounding box
    import numpy as np
    arr = np.array(img)
    alpha = arr[:, :, 3]
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)

    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        # Add small padding
        pad = 4
        rmin = max(0, rmin - pad)
        rmax = min(arr.shape[0] - 1, rmax + pad)
        cmin = max(0, cmin - pad)
        cmax = min(arr.shape[1] - 1, cmax + pad)
        img = img.crop((cmin, rmin, cmax + 1, rmax + 1))

    img.save(output_path, 'PNG')
    print(f"OK:{img.size[0]}x{img.size[1]}")


if __name__ == '__main__':
    main()

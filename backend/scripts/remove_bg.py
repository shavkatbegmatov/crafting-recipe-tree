#!/usr/bin/env python3
"""
Background removal + icon extraction from game screenshots.
1. rembg removes background
2. Find the largest connected non-transparent region (the icon)
3. Crop to that region only (ignoring text fragments)

Usage: python remove_bg.py <input_path> <output_path>
"""
import sys
import io
import numpy as np
from rembg import remove
from PIL import Image


def find_largest_blob(alpha, threshold=20):
    """Find the largest connected region of non-transparent pixels."""
    from scipy import ndimage

    binary = (alpha > threshold).astype(np.uint8)
    labeled, num_features = ndimage.label(binary)

    if num_features == 0:
        return None

    # Find the largest component
    sizes = ndimage.sum(binary, labeled, range(1, num_features + 1))
    largest_label = np.argmax(sizes) + 1

    # Create mask for only the largest blob
    mask = (labeled == largest_label)
    return mask


def find_largest_blob_simple(alpha, threshold=20):
    """Fallback: simple flood-fill approach without scipy."""
    binary = alpha > threshold
    h, w = binary.shape

    visited = np.zeros_like(binary, dtype=bool)
    best_mask = None
    best_size = 0

    for start_r in range(0, h, 10):
        for start_c in range(0, w, 10):
            if not binary[start_r, start_c] or visited[start_r, start_c]:
                continue

            # BFS flood fill
            mask = np.zeros_like(binary, dtype=bool)
            queue = [(start_r, start_c)]
            count = 0

            while queue:
                r, c = queue.pop(0)
                if r < 0 or r >= h or c < 0 or c >= w:
                    continue
                if visited[r, c] or not binary[r, c]:
                    continue

                visited[r, c] = True
                mask[r, c] = True
                count += 1

                # 4-connectivity
                queue.extend([(r-1, c), (r+1, c), (r, c-1), (r, c+1)])

            if count > best_size:
                best_size = count
                best_mask = mask.copy()

    return best_mask


def main():
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # Step 1: Remove background with rembg
    with open(input_path, 'rb') as f:
        input_data = f.read()

    output_data = remove(input_data)
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]

    # Step 2: Find the largest connected blob (the icon, not text)
    try:
        mask = find_largest_blob(alpha, threshold=30)
    except ImportError:
        mask = find_largest_blob_simple(alpha, threshold=30)

    if mask is not None:
        # Zero out everything except the largest blob
        arr[~mask, 3] = 0
        img = Image.fromarray(arr)

    # Step 3: Crop to bounding box of remaining content
    alpha = np.array(img)[:, :, 3]
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)

    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        pad = 6
        rmin = max(0, rmin - pad)
        rmax = min(img.height - 1, rmax + pad)
        cmin = max(0, cmin - pad)
        cmax = min(img.width - 1, cmax + pad)
        img = img.crop((cmin, rmin, cmax + 1, rmax + 1))

    img.save(output_path, 'PNG')
    print(f"OK:{img.size[0]}x{img.size[1]}")


if __name__ == '__main__':
    main()

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "badges" / "badge-sheet-source.png"
OUTPUT_DIR = ROOT / "assets" / "badges"

OUTPUT_SIZE = 256
TRIM_PADDING = 12

ROW_NAMES = [
    "scan-camera",
    "ingredient-finder",
    "fridge-curator",
    "sous-chat",
    "quick-pan",
    "fresh-bowl",
    "master-chef",
]

COLUMN_NAMES = ["bronze", "silver", "gold"]

X_BOUNDS = [0, 343, 684, 1024]
Y_BOUNDS = [0, 264, 463, 651, 834, 1018, 1207, 1536]


def is_background(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return max(rgb) >= 234 and (max(rgb) - min(rgb)) <= 18


def punch_out_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        if not is_background(pixels[x, y][:3]):
            continue

        pixels[x, y] = (255, 255, 255, 0)

        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                queue.append((nx, ny))

    return rgba


def fit_to_square(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (255, 255, 255, 0))

    left, top, right, bottom = bbox
    trimmed = image.crop(
        (
            max(0, left - TRIM_PADDING),
            max(0, top - TRIM_PADDING),
            min(image.width, right + TRIM_PADDING),
            min(image.height, bottom + TRIM_PADDING),
        )
    )

    canvas = Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (255, 255, 255, 0))
    offset_x = (OUTPUT_SIZE - trimmed.width) // 2
    offset_y = (OUTPUT_SIZE - trimmed.height) // 2
    canvas.paste(trimmed, (offset_x, offset_y), trimmed)
    return canvas


def crop_cell(sheet: Image.Image, left: int, top: int, right: int, bottom: int) -> Image.Image:
    crop = sheet.crop((left, top, right, bottom))
    return fit_to_square(punch_out_background(crop))


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for row_index, row_name in enumerate(ROW_NAMES):
        top = Y_BOUNDS[row_index]
        bottom = Y_BOUNDS[row_index + 1]

        for column_index, column_name in enumerate(COLUMN_NAMES):
            left = X_BOUNDS[column_index]
            right = X_BOUNDS[column_index + 1]
            badge = crop_cell(sheet, left, top, right, bottom)
            badge.save(OUTPUT_DIR / f"{column_name}-{row_name}.png")


if __name__ == "__main__":
    main()

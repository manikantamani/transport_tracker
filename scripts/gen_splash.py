"""Regenerate splash with 'Krishnaveni Transports' wordmark."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BRAND = (30, 58, 138, 255)
BRAND_LIGHT = (59, 130, 246, 255)
WHITE = (255, 255, 255, 255)

OUT = "/app/frontend/assets/images"

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def rounded_rect(size, radius, color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=color)
    return img


def draw_truck(draw, cx, cy, scale, body_color=WHITE, accent=BRAND_LIGHT):
    w = int(560 * scale)
    h = int(280 * scale)
    x0 = cx - w // 2
    y0 = cy - h // 2

    box_w = int(w * 0.55)
    draw.rounded_rectangle(
        [x0, y0, x0 + box_w, y0 + h], radius=int(24 * scale), fill=body_color
    )

    cab_x0 = x0 + box_w + int(10 * scale)
    cab_top = y0 + int(h * 0.28)
    draw.rounded_rectangle(
        [cab_x0, cab_top, x0 + w, y0 + h], radius=int(24 * scale), fill=body_color
    )

    win_pad = int(14 * scale)
    draw.rounded_rectangle(
        [
            cab_x0 + win_pad,
            cab_top + win_pad,
            x0 + w - win_pad,
            cab_top + int((h - (cab_top - y0)) * 0.55),
        ],
        radius=int(12 * scale),
        fill=accent,
    )

    stripe_h = int(28 * scale)
    stripe_y = y0 + h // 2 - stripe_h // 2
    draw.rectangle(
        [x0 + int(20 * scale), stripe_y, x0 + box_w - int(20 * scale), stripe_y + stripe_h],
        fill=accent,
    )

    wheel_r = int(52 * scale)
    wheel_y = y0 + h + int(6 * scale)
    for wx in [
        x0 + int(box_w * 0.28),
        cab_x0 + int((x0 + w - cab_x0) * 0.55),
    ]:
        draw.ellipse(
            [wx - wheel_r, wheel_y - wheel_r, wx + wheel_r, wheel_y + wheel_r],
            fill=(15, 23, 42, 255),
        )
        draw.ellipse(
            [wx - wheel_r // 2, wheel_y - wheel_r // 2, wx + wheel_r // 2, wheel_y + wheel_r // 2],
            fill=body_color,
        )


def make_splash():
    w, h = 1284, 2778
    img = Image.new("RGBA", (w, h), BRAND)

    hi = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi)
    for r in range(1200, 0, -30):
        alpha = int(20 * (r / 1200))
        hd.ellipse(
            [w // 2 - r, h // 2 - r, w // 2 + r, h // 2 + r],
            fill=(255, 255, 255, max(0, 20 - alpha)),
        )
    hi = hi.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img, hi)

    # Rounded card with truck
    card_size = 520
    card = rounded_rect(card_size, 120, WHITE)
    cx = (w - card_size) // 2
    cy = (h - card_size) // 2 - 220
    img.paste(card, (cx, cy), card)

    d = ImageDraw.Draw(img)
    draw_truck(d, w // 2, cy + card_size // 2, scale=0.7, body_color=BRAND, accent=BRAND_LIGHT)

    # Wordmark
    title_font = ImageFont.truetype(FONT_BOLD, 92)
    sub_font = ImageFont.truetype(FONT_REG, 46)

    title = "Krishnaveni Transports"
    tw = d.textlength(title, font=title_font)
    ty = cy + card_size + 90
    d.text(((w - tw) / 2, ty), title, fill=WHITE, font=title_font)

    sub = "Trip Diary  •  Fleet  •  Drivers"
    sw = d.textlength(sub, font=sub_font)
    d.text(((w - sw) / 2, ty + 130), sub, fill=(255, 255, 255, 180), font=sub_font)

    img.save(f"{OUT}/splash-image.png")
    print("wrote splash-image.png")


if __name__ == "__main__":
    make_splash()

#!/usr/bin/env python3
"""Gera os avatares das contas de teste: infra/seed-uploads/avatars/u<id>.png.

Iniciais do nome sobre um gradiente, uma cor por conta. Lê a lista USERS do gen_seed.py,
por isso o id de cada avatar bate certo com o usr_id do seed.

Uso, na raiz do repositório (precisa de Pillow):
    python infra/postgres/tools/gen_avatars.py
"""
import ast
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SEED = os.path.join(ROOT, "infra", "postgres", "tools", "gen_seed.py")
OUT = os.path.join(ROOT, "infra", "seed-uploads", "avatars")
SIZE = 256

# (cor clara, cor escura) de cada gradiente; o dourado é o da marca NextBid
PALETTE = [
    ("#D9BC72", "#8A6A22"), ("#5B8DEF", "#1F3F8F"), ("#4FB3A9", "#17635C"), ("#E0795B", "#8F3520"),
    ("#A77BD8", "#4F2A80"), ("#6FAF5E", "#2F6624"), ("#E46A8C", "#8C2346"), ("#5AA9D6", "#1B5A80"),
    ("#C98B4E", "#6E4216"), ("#7C86E0", "#2C338A"), ("#D7A23B", "#7A5410"), ("#55B88A", "#1D6B47"),
    ("#D86F6F", "#7E2525"), ("#8E9AAF", "#3B4559"),
]


def font(size):
    for path in ("/usr/share/fonts/truetype/google-fonts/Poppins-SemiBold.ttf",
                 "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
                 "C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def avatar(name, colors):
    light, dark = hex_rgb(colors[0]), hex_rgb(colors[1])
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x + y) / (2 * (SIZE - 1))          # gradiente na diagonal
            px[x, y] = tuple(round(light[c] + (dark[c] - light[c]) * t) for c in range(3))
    d = ImageDraw.Draw(img)
    parts = name.split()
    initials = (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()
    f = font(104)
    box = d.textbbox((0, 0), initials, font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    pos = ((SIZE - w) / 2 - box[0], (SIZE - h) / 2 - box[1])
    d.text((pos[0] + 2, pos[1] + 3), initials, font=f, fill=tuple(round(c * 0.55) for c in dark))  # sombra
    d.text(pos, initials, font=f, fill=(255, 255, 255))
    return img


def main():
    tree = ast.parse(open(SEED, encoding="utf-8").read())
    users = next(ast.literal_eval(n.value) for n in tree.body
                 if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "USERS")
    os.makedirs(OUT, exist_ok=True)
    for i, u in enumerate(users, start=1):
        path = os.path.join(OUT, f"u{i}.png")
        avatar(u[0], PALETTE[(i - 1) % len(PALETTE)]).save(path, optimize=True)
        print(path)


if __name__ == "__main__":
    main()

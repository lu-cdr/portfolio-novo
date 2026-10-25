"""Prepara as texturas do fundo a partir das imagens enviadas pelo Lucas (build/fontes/).

Uso:  python build/gerar_texturas.py

Nada é desenhado por código: só recorte, alfa e otimização.
  azulejos.webp         peças recortadas de azulejo-ref.png e remontadas numa grade 6×6 sorteada
  sombra-monstera.webp  sombra-monstera.webp (já tem alfa) → preto com o mesmo alfa
  sombra-palmeira.webp  sombra-palmeira.png (cinza claro sobre branco) → preto com alfa
"""
from pathlib import Path

import random

import numpy as np
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "build" / "fontes"
IMG = RAIZ / "img"
IMG.mkdir(exist_ok=True)


def azulejos(cols=6, rows=6):
    """Recorta cada peça inteira de azulejo-ref.png (rejunte ao redor incluído) e remonta
    uma grade 6×6 sorteada, com algumas peças espelhadas. Assim a repetição não aparece
    e as bordas da textura caem no meio do rejunte (emenda sem costura)."""
    ref = Image.open(FONTES / "azulejo-ref.png").convert("RGB")
    xs = [143, 304, 465, 626]          # meio do rejunte, medido na imagem
    ys = [100, 204, 309, 412, 513]
    pecas = []
    for y0, y1 in zip(ys, ys[1:]):
        for x0, x1 in zip(xs, xs[1:]):
            p = ref.crop((x0, y0, x1, y1)).resize((322, 206), Image.LANCZOS)
            pecas += [p, ImageOps.mirror(p)]
    rnd = random.Random(3)
    t = Image.new("RGB", (322 * cols, 206 * rows))
    for j in range(rows):
        for i in range(cols):
            t.paste(rnd.choice(pecas), (322 * i, 206 * j))
    t.save(IMG / "azulejos.webp", quality=86)


def sombra(origem, destino, ganho, de_luminancia):
    im = Image.open(FONTES / origem).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    if de_luminancia:   # cinza sobre branco: quanto mais escuro, mais sombra (o alfa do arquivo é ignorado)
        alfa = 255 - arr[..., :3].mean(-1)
    else:
        alfa = arr[..., 3]
    alfa = np.clip(alfa * ganho, 0, 255).astype(np.uint8)
    out = np.zeros((*alfa.shape, 4), np.uint8)
    out[..., 3] = alfa
    o = Image.fromarray(out)
    if max(o.size) > 1600:
        o.thumbnail((1600, 1600), Image.LANCZOS)
    o.save(IMG / destino, quality=82, method=6)


azulejos()
sombra("sombra-monstera.webp", "sombra-monstera.webp", 1.0, False)
sombra("sombra-palmeira.png", "sombra-palmeira.webp", 5.0, True)
for f in ("azulejos.webp", "sombra-monstera.webp", "sombra-palmeira.webp"):
    print(f, round((IMG / f).stat().st_size / 1024), "KB")

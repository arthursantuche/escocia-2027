"""Gera os ícones do portal: a bandeira da Escócia, plana, ocupando o quadrado inteiro, com a cruz
de canto a canto e a mesma proporção de assets/img/bandeira.svg (Pantone 300, largura da cruz de
1/5 da altura). Grava assets/img/bandeira-<tamanho>.png.

Uso, em Portal/: python3 scripts/gerar-icones.py
Requer Pillow.
"""
from PIL import Image, ImageDraw

AZUL, BRANCO, ESCALA = (0, 94, 184), (255, 255, 255), 8
for lado in (16, 32, 48, 180, 192, 512):
    g = lado * ESCALA
    img = Image.new('RGB', (g, g), AZUL)
    d = g * 0.2 / 2 * 2 ** 0.5  # meia largura da cruz, medida na borda
    desenho = ImageDraw.Draw(img)
    desenho.polygon([(0, 0), (d, 0), (g, g - d), (g, g), (g - d, g), (0, d)], fill=BRANCO)
    desenho.polygon([(g, 0), (g, d), (d, g), (0, g), (0, g - d), (g - d, 0)], fill=BRANCO)
    img.resize((lado, lado), Image.LANCZOS).save(f'assets/img/bandeira-{lado}.png', optimize=True)

"""Baixa as fotos das cidades e da abertura do Wikimedia Commons, recorta em 3:2 no
ponto focal de cada uma e grava em WebP com 800, 1600 e 2400 px de largura:
assets/img/cidades/<nome>-<largura>.webp. Grava os créditos (autor, licença, página,
alteração) em assets/img/cidades/creditos.json, exibidos no portal junto de cada foto.

Licenças aceitas: CC0, domínio público, CC BY e CC BY-SA (que exigem crédito e, no
caso de SA, indicar a alteração; o recorte e o redimensionamento ficam registrados).

Uso, na raiz do repositório: python3 scripts/baixar-fotos.py
Requer Pillow com WebP (pip install Pillow). Os originais baixados ficam numa pasta
temporária, fora do repositório, e são apagados no fim.
"""
import json
import math
import os
import re
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image

# nome: (arquivo no Commons, foco horizontal, foco vertical). O foco (0 a 1) é o centro
# do recorte 3:2: 0,5 = meio; menor = mais à esquerda/acima.
FOTOS = {
    'edimburgo': ('File:Skyline of Edinburgh.jpg', 0.42, 0.5),
    'st-andrews': ('File:St Andrews, sunset on the cathedral ruins - geograph.org.uk - 4891213.jpg', 0.5, 0.4),
    'glasgow': ('File:Glasgow University (49078377092).jpg', 0.5, 0.5),
    'glencoe': ('File:Buachaille Etive Mòr - 40339525345.jpg', 0.5, 0.5),
    'fort-william': ('File:Ben Nevis from the Corpach Wreck - geograph.org.uk - 6370132.jpg', 0.5, 0.5),
    'isle-of-skye': ('File:Old Man of Storr, Scottish Highlands.jpg', 0.5, 0.5),
    'inverness': ('File:Inverness Castle on a Spring day (40710862772).jpg', 0.6, 0.5),
    'abertura': ('File:A small loch in the saddle between Beinn an Dothaidh and Beinn Dorain, Scotland 01.jpg', 0.5, 0.5),
}
LARGURAS = (800, 1600, 2400)
PROPORCAO = 3 / 2
LIMITE_1600 = 300 * 1024  # peso máximo da versão de 1600 px (a que fica offline)
LICENCAS = re.compile(r'^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$', re.I)
UA = {'User-Agent': 'PortalEscocia2027/1.0 (uso pessoal)'}
DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img', 'cidades')


def abrir(url):
    # O Commons responde 429 quando há pedidos demais seguidos: espera e tenta de novo.
    for espera in (5, 15, 40, 90):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(espera)
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA))


def info(titulo):
    # Pede uma miniatura grande o bastante para o recorte 3:2 ter 2400 px de largura.
    p = {'action': 'query', 'format': 'json', 'titles': titulo, 'prop': 'imageinfo', 'iiprop': 'size'}
    pagina = next(iter(json.load(abrir('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)))['query']['pages'].values()))
    w, h = pagina['imageinfo'][0]['width'], pagina['imageinfo'][0]['height']
    pedido = min(w, max(LARGURAS[-1], math.ceil(LARGURAS[-1] / PROPORCAO / h * w) + 20))
    p.update({'iiprop': 'url|extmetadata', 'iiurlwidth': pedido})
    pagina = next(iter(json.load(abrir('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)))['query']['pages'].values()))
    ii = pagina['imageinfo'][0]
    m = ii['extmetadata']
    limpar = lambda s: re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', s)).strip()
    licenca = m.get('LicenseShortName', {}).get('value', '')
    if not LICENCAS.match(licenca):
        raise ValueError(f'{titulo}: licença não aceita ({licenca})')
    return ii.get('thumburl') or ii['url'], {
        'titulo': titulo.replace('File:', ''),
        'autor': limpar(m.get('Artist', {}).get('value', 'Desconhecido')),
        'licenca': licenca,
        'licencaUrl': m.get('LicenseUrl', {}).get('value', ''),
        'pagina': ii['descriptionurl'],
        'fonte': 'Wikimedia Commons',
        'alteracoes': 'recortada em 3:2 e redimensionada',
    }


def recortar(im, fx, fy):
    w, h = im.size
    if w / h > PROPORCAO:
        nw = round(h * PROPORCAO)
        x = min(max(round(fx * w - nw / 2), 0), w - nw)
        return im.crop((x, 0, x + nw, h))
    nh = round(w / PROPORCAO)
    y = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((0, y, w, y + nh))


def gravar(im, nome, largura):
    caminho = os.path.join(DESTINO, f'{nome}-{largura}.webp')
    copia = im.resize((largura, round(largura / PROPORCAO)), Image.LANCZOS)
    for qualidade in (80, 74, 68, 62, 56):
        copia.save(caminho, 'WEBP', quality=qualidade, method=6)
        if largura != 1600 or os.path.getsize(caminho) <= LIMITE_1600:
            break
    return os.path.getsize(caminho) // 1024


def main():
    os.makedirs(DESTINO, exist_ok=True)
    creditos = {}
    with tempfile.TemporaryDirectory() as tmp:
        for nome, (titulo, fx, fy) in FOTOS.items():
            url, dados = info(titulo)
            original = os.path.join(tmp, nome)
            with abrir(url) as r, open(original, 'wb') as f:
                f.write(r.read())
            im = recortar(Image.open(original).convert('RGB'), fx, fy)
            if im.width < LARGURAS[-1]:
                raise ValueError(f'{nome}: recorte com {im.width} px, menor que {LARGURAS[-1]} px')
            pesos = [gravar(im, nome, w) for w in LARGURAS]
            creditos[nome] = dados
            print(nome, ' / '.join(f'{w}px {p} KB' for w, p in zip(LARGURAS, pesos)), '|', dados['licenca'], '|', dados['autor'])
            time.sleep(3)
    with open(os.path.join(DESTINO, 'creditos.json'), 'w', encoding='utf-8') as f:
        json.dump(creditos, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()

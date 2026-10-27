"""Baixa as fotos das cidades do Wikimedia Commons (licenças CC BY / CC BY-SA)
em assets/img/cidades/<cidade>.jpg (1400 px de largura) e grava os créditos em
assets/img/cidades/creditos.json, exibidos no portal junto de cada foto.

Uso: python3 -I scripts/baixar-fotos.py   (sem dependências; usa `sips` do macOS para comprimir)
"""
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

FOTOS = {
    'edimburgo': 'File:Edinburgh Skyline Panorama.jpg',
    'st-andrews': 'File:St Andrews Cathedral, Fife - geograph.org.uk - 5496042.jpg',
    'glasgow': 'File:Kelvingrove from Glasgow University Tower.jpg',
    'glencoe': 'File:Glen Coe Rainbow.jpg',
    'fort-william': 'File:Glenfinnan Site.jpg',
    'isle-of-skye': 'File:Quiraing, Isle of Skye, Scotland - Diliff.jpg',
    'inverness': 'File:Inverness Castle and the River Ness - geograph.org.uk - 2895311.jpg',
}
UA = {'User-Agent': 'PortalEscocia2027/1.0 (uso pessoal)'}
DESTINO = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'cidades')


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
    p = {'action': 'query', 'format': 'json', 'titles': titulo, 'prop': 'imageinfo',
         'iiprop': 'url|extmetadata', 'iiurlwidth': 1600}
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)
    pagina = next(iter(json.load(abrir(url))['query']['pages'].values()))
    ii = pagina['imageinfo'][0]
    m = ii['extmetadata']
    limpar = lambda s: re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', s)).strip()
    return {
        'arquivo': ii['thumburl'],
        'titulo': titulo.replace('File:', ''),
        'autor': limpar(m.get('Artist', {}).get('value', 'Desconhecido')),
        'licenca': m.get('LicenseShortName', {}).get('value', ''),
        'pagina': ii['descriptionurl'],
    }


def main():
    os.makedirs(DESTINO, exist_ok=True)
    creditos = {}
    for nome, titulo in FOTOS.items():
        dados = info(titulo)
        caminho = os.path.join(DESTINO, nome + '.jpg')
        with abrir(dados.pop('arquivo')) as r, open(caminho, 'wb') as f:
            f.write(r.read())
        subprocess.run(['sips', '-s', 'formatOptions', '60', '--resampleWidth', '1400', caminho], check=True, capture_output=True)
        creditos[nome] = dados
        time.sleep(3)
        print(nome, os.path.getsize(caminho) // 1024, 'KB', dados['licenca'], dados['autor'])
    with open(os.path.join(DESTINO, 'creditos.json'), 'w', encoding='utf-8') as f:
        json.dump(creditos, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()

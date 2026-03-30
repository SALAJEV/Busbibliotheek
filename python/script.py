# Busbibliotheek WVL (Python) versie 29 maart 2026

import csv
import base64
import html
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import webbrowser
from datetime import date
from io import StringIO

# Constanten
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
VEHICLES_FILE = "vehicles.txt"
DOWNLOAD_URL = "https://pub-611b5bc156eb455ba86d9bcece9aea1c.r2.dev/vehicles.txt"
PDF_LOGO_URL = "https://busbibliotheek95.pages.dev/media/logo.png"
SITE_URL = "https://sites.google.com/view/delijn-busspotter"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}

# ANSI kleuren
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def _print_header():
    """Print een grafische header."""
    print("\033[92m" + "="*70)  # Groen
    print("  ____            _     _ _     _ _       _   _               _    ")
    print(" |  _ \\          | |   (_) |   | (_)     | | | |             | |   ")
    print(" | |_) |_   _ ___| |__  _| |__ | |_  ___ | |_| |__   ___  ___| | __")
    print(" |  _ <| | | / __| '_ \\| | '_ \\| | |/ _ \\| __| '_ \\ / _ \\/ _ \\ |/ /")
    print(" | |_) | |_| \\__ \\ |_) | | |_) | | | (_) | |_| | | |  __/  __/   < ")
    print(" |____/ \\__,_|___/_.__/|_|_.__/|_|_|\\___/ \\__|_| |_|\\___|\\___|_|\\_\\")
    print("="*70 + "\033[0m")  # Reset kleur


def _print_welkom():
    """Toon een vriendelijke begroeting bij het opstarten."""
    print("Welkom bij Busbibliotheek 95.")
    print("Met dit script kunt u voertuigen opzoeken en lijsten per eigenaar exporteren.")
    print("Dank u om Busbibliotheek 95 te gebruiken.\n")


def _find_file():
    """Zoek naar vehicles.txt bestand."""
    txt_file = os.path.join(BASE_DIR, VEHICLES_FILE)

    if os.path.exists(txt_file):
        return txt_file

    print(f"{YELLOW}[INFO]{RESET} Welkom. Het databestand '{VEHICLES_FILE}' werd nog niet gevonden.")
    print("       Geen probleem: dit is normaal bij een eerste opstart.")
    print("       Het bestand kan automatisch voor u gedownload worden.\n")

    # Vraag gebruiker
    if sys.stdin.isatty():
        antwoord = input("Hebt u het bestand al ergens op uw computer staan? (ja/nee): ").strip().lower()
        if antwoord in ["ja", "j"]:
            pad = input("Voer het volledige pad naar vehicles.txt in: ").strip()
            if pad and os.path.exists(pad):
                return pad
            else:
                print(f"{RED}[ERROR]{RESET} Het bestand bestaat niet op dit pad: {pad}")
        else:
            print(f"{YELLOW}[INFO]{RESET} Het bestand wordt nu automatisch gedownload.\n")
    else:
        print(f"{YELLOW}[INFO]{RESET} Niet-interactieve modus: het bestand wordt automatisch gedownload.\n")

    return None

def _download_file(txt_file):
    """Download vehicles.txt van URL."""
    print(f"{BLUE}[DOWNLOAD]{RESET} Bezig met downloaden van voertuigendata...")
    download_ok = False

    for poging in range(1, 4):
        try:
            req = urllib.request.Request(DOWNLOAD_URL, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status != 200:
                    raise ValueError(f"HTTP {response.status}")
                data_bytes = response.read()
            with open(txt_file, 'wb') as out:
                out.write(data_bytes)
            print(f"{GREEN}[OK]{RESET} Download succesvol voltooid.")
            print(f"{GREEN}[INFO]{RESET} Het bestand werd opgeslagen in: {txt_file}")
            download_ok = True
            break
        except Exception as e:
            print(f"{RED}[ERROR]{RESET} Poging {poging} mislukt: {e}")
            if poging < 3:
                print(f"{YELLOW}[INFO]{RESET} Er wordt opnieuw geprobeerd...")
                time.sleep(2)

    if not download_ok:
        print(f"{RED}[ERROR]{RESET} Download mislukt na 3 pogingen.")
        print(f"{YELLOW}[INFO]{RESET} U kunt deze URL eventueel manueel openen in uw browser:")
        print(f"       {DOWNLOAD_URL}")
        print(f"{YELLOW}[INFO]{RESET} Plaats het gedownloade bestand daarna in dezelfde map als dit script.")
        return False
    return True

def _load_from_file(txt_file):
    """Laad data uit TXT-bestand."""
    try:
        with open(txt_file, 'r', encoding='utf-8') as f:
            # Sla regels over die beginnen met '#'
            lines = [line for line in f if not line.strip().startswith('#')]
        reader = csv.DictReader(StringIO(''.join(lines)), delimiter=';')
        data = [row for row in reader]
        print(f"{GREEN}[OK]{RESET} {len(data)} bussen ingeladen")
        return data
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Fout bij inladen: {e}")
        return []


def update_data():
    """Update vehicles.txt van de URL."""
    txt_file = os.path.join(BASE_DIR, VEHICLES_FILE)
    print(f"{YELLOW}[INFO]{RESET} Start update van vehicles.txt...")
    if _download_file(txt_file):
        print(f"{GREEN}[OK]{RESET} Update voltooid. Herlaad data...")
        return _load_from_file(txt_file)
    print(f"{RED}[ERROR]{RESET} Update mislukt.")
    return None


def load_data():
    """Laad busdata uit TXT-bestand of download indien nodig."""
    txt_file = _find_file()
    if not txt_file:
        txt_file = os.path.join(BASE_DIR, VEHICLES_FILE)
        if not _download_file(txt_file):
            return []
    return _load_from_file(txt_file)


def _toon_voertuignummer(voertuignummer):
    """Verwijder interne letterprefix bij weergave aan de gebruiker."""
    if voertuignummer and len(voertuignummer) > 1 and voertuignummer[0].isalpha():
        return voertuignummer[1:]
    return voertuignummer


def _toon_waarde(waarde, fallback="-"):
    """Toon een nette fallback voor lege of ontbrekende waarden."""
    if not waarde:
        return fallback

    waarde = waarde.strip()
    if waarde in {"", "/"}:
        return fallback
    return waarde


def _kort(tekst, breedte):
    """Kort tekst in zodat tabellen leesbaar blijven."""
    tekst = str(tekst)
    if len(tekst) <= breedte:
        return tekst.ljust(breedte)
    return tekst[:breedte - 3] + "..."


def _maak_rood(tekst):
    """Zet tekst in het rood."""
    return f"{RED}{tekst}{RESET}"


ALGEMENE_EIGENAARSGROEPEN = ("Hansea", "Ferry Cars Groep", "Keolis", "Waaslandia")
PDF_THEMAS = {
    "wit": {
        "page_bg": "#f8fafc",
        "badge_bg": "linear-gradient(135deg, #e5e7eb, #f8fafc)",
        "badge_fg": "#374151",
        "accent": "#d1d5db",
        "accent_soft": "#e5e7eb",
        "card_line": "#e5e7eb",
    },
    "geel": {
        "page_bg": "#fff8db",
        "badge_bg": "linear-gradient(135deg, #fde68a, #fef3c7)",
        "badge_fg": "#92400e",
        "accent": "#f4d67a",
        "accent_soft": "#f3e2a5",
        "card_line": "#f8edbf",
    },
    "groen": {
        "page_bg": "#eefbf2",
        "badge_bg": "linear-gradient(135deg, #bbf7d0, #dcfce7)",
        "badge_fg": "#166534",
        "accent": "#86efac",
        "accent_soft": "#bbf7d0",
        "card_line": "#d9fbe4",
    },
    "blauw": {
        "page_bg": "#eff6ff",
        "badge_bg": "linear-gradient(135deg, #93c5fd, #dbeafe)",
        "badge_fg": "#1d4ed8",
        "accent": "#93c5fd",
        "accent_soft": "#bfdbfe",
        "card_line": "#dbeafe",
    },
    "oranje": {
        "page_bg": "#fff3e8",
        "badge_bg": "linear-gradient(135deg, #fdba74, #ffedd5)",
        "badge_fg": "#9a3412",
        "accent": "#fdba74",
        "accent_soft": "#fed7aa",
        "card_line": "#ffe5c8",
    },
    "rood": {
        "page_bg": "#fff1f2",
        "badge_bg": "linear-gradient(135deg, #fda4af, #ffe4e6)",
        "badge_fg": "#9f1239",
        "accent": "#fda4af",
        "accent_soft": "#fecdd3",
        "card_line": "#ffe0e4",
    },
    "paars": {
        "page_bg": "#f6f0ff",
        "badge_bg": "linear-gradient(135deg, #d8b4fe, #f3e8ff)",
        "badge_fg": "#6b21a8",
        "accent": "#d8b4fe",
        "accent_soft": "#e9d5ff",
        "card_line": "#efe3ff",
    },
}


def _is_verborgen_eigenaar(eigenaar):
    """Geef aan of een eigenaar niet in de keuzelijst mag komen."""
    return eigenaar.strip() in {"", "/", "**Onbekend**", "De Lijn (eigen beheer)"}


def _eigenaar_groep(eigenaar):
    """Groepeer eigenaars die onder dezelfde maatschappij vallen."""
    eigenaar = eigenaar.strip()

    if _is_verborgen_eigenaar(eigenaar):
        return None
    if eigenaar == "Ferry Cars":
        return "Ferry Cars"
    if "(Ferry Cars)" in eigenaar:
        return "Ferry Cars Groep"
    for groep in ALGEMENE_EIGENAARSGROEPEN:
        if groep in eigenaar:
            return groep
    return eigenaar


def _beschikbare_eigenaars(data):
    """Geef de eigenaars terug die in het keuzemenu mogen verschijnen."""
    individuele_eigenaars = {
        bus.get("owner", "").strip()
        for bus in data
        if not _is_verborgen_eigenaar(bus.get("owner", ""))
    }
    gegroepeerde_eigenaars = {
        _eigenaar_groep(eigenaar)
        for eigenaar in individuele_eigenaars
    }
    gegroepeerde_eigenaars.discard(None)
    eigenaars = individuele_eigenaars | gegroepeerde_eigenaars
    return sorted(eigenaars, key=str.casefold)


def _filter_bussen_op_eigenaar(eigenaar, data):
    """Filter bussen op gekozen eigenaar of eigenaarsgroep."""
    if eigenaar in ALGEMENE_EIGENAARSGROEPEN:
        return [
            bus for bus in data
            if _eigenaar_groep(bus.get("owner", "")) == eigenaar
        ]
    return [
        bus for bus in data
        if bus.get("owner", "").strip() == eigenaar
    ]


def _voertuignummer_sorteersleutel(bus):
    """Sorteer op voertuignummer, met 0-reeksen tussen de 6-reeksen."""
    voertuignummer = _toon_voertuignummer(bus.get("vehicle_id", "").strip())

    if voertuignummer.isdigit():
        if voertuignummer.startswith("0"):
            return (0, int(f"6{voertuignummer[1:]}"), voertuignummer)
        return (0, int(voertuignummer), voertuignummer)
    return (1, voertuignummer.casefold())


def _bus_sleutel(bus):
    """Unieke sleutelwaarde voor een bus binnen de huidige sessie."""
    return id(bus)


def _format_status_datum(datum, fallback):
    """Toon een datum netjes of een leesbare fallback."""
    geformatteerd = _format_date_europees(datum.strip())
    return geformatteerd or fallback


def _bus_is_uit_dienst(bus):
    """Controleer of een bus uit dienst is."""
    ud_date = bus.get("ud_date", "").strip()
    return ud_date not in {"", "/"}


def _veilige_bestandsnaam(naam):
    """Maak een Windows-veilige bestandsnaam op basis van de eigenaar."""
    verboden_tekens = '<>:"/\\|?*'
    veilige_naam = "".join("_" if teken in verboden_tekens else teken for teken in naam).strip()
    return veilige_naam.rstrip(". ") or "lijst"


def _html_kort(tekst, breedte):
    """Kort tekst in voor HTML-weergave zodat de layout stabiel blijft."""
    tekst = str(tekst)
    if len(tekst) <= breedte:
        return tekst
    return tekst[:breedte - 3] + "..."


def _standaard_downloadsmap():
    """Geef de standaard downloadsmap van de gebruiker terug."""
    downloads_map = os.path.join(os.path.expanduser("~"), "Downloads")
    if os.path.isdir(downloads_map):
        return downloads_map
    return os.path.expanduser("~")


def _edge_pad():
    """Zoek Microsoft Edge voor HTML-naar-PDF export."""
    kandidaten = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for kandidaat in kandidaten:
        if os.path.exists(kandidaat):
            return kandidaat
    return None


def _haal_pdf_logo_data_uri():
    """Haal het PDF-logo op en geef het terug als data URI, of None zonder internet."""
    try:
        req = urllib.request.Request(PDF_LOGO_URL, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status != 200:
                return None
            beeld_data = response.read()
        if not beeld_data:
            return None
        encoded = base64.b64encode(beeld_data).decode("ascii")
        return f"data:image/png;base64,{encoded}"
    except Exception:
        return None


def _eigenaar_dataset(eigenaar, data, include_retired=True, removed_bussen=None, extra_bussen=None):
    """Haal de gesorteerde dataset voor een eigenaar op."""
    bussen = _filter_bussen_op_eigenaar(eigenaar, data)
    if not include_retired:
        bussen = [bus for bus in bussen if not _bus_is_uit_dienst(bus)]
    removed_bussen = removed_bussen or set()
    extra_bussen = extra_bussen or []
    aanwezige_bussen = {_bus_sleutel(bus) for bus in bussen}

    bussen = [bus for bus in bussen if _bus_sleutel(bus) not in removed_bussen]
    aanwezige_bussen = {_bus_sleutel(bus) for bus in bussen}
    for extra_bus in extra_bussen:
        if _bus_sleutel(extra_bus) not in aanwezige_bussen:
            bussen.append(extra_bus)
            aanwezige_bussen.add(_bus_sleutel(extra_bus))
    if not bussen:
        return None, False, False

    bussen.sort(key=_voertuignummer_sorteersleutel)
    toon_hansea = any(_toon_waarde(bus.get("hansea_id", "")) != "-" for bus in bussen)
    toon_intern = any(_toon_waarde(bus.get("intern_id", "")) != "-" for bus in bussen)
    return bussen, toon_hansea, toon_intern


def _toon_volledige_eigenaar_in_pdf(eigenaar):
    """Bepaal of de volledige eigenaar per bus in de PDF moet staan."""
    return eigenaar in ALGEMENE_EIGENAARSGROEPEN


def _maak_eigenaar_html(eigenaar, data, include_retired=True, removed_bussen=None, extra_bussen=None, thema="geel"):
    """Maak een nette HTML-weergave voor PDF-export."""
    bussen, toon_hansea, toon_intern = _eigenaar_dataset(
        eigenaar,
        data,
        include_retired=include_retired,
        removed_bussen=removed_bussen,
        extra_bussen=extra_bussen,
    )
    if not bussen:
        return None

    kaarten = []
    toon_volledige_eigenaar = _toon_volledige_eigenaar_in_pdf(eigenaar)
    for bus in bussen:
        voertuignummer = html.escape(_toon_waarde(_toon_voertuignummer(bus.get("vehicle_id", "").strip())))
        bus_type = html.escape(_html_kort(_toon_waarde(bus.get("bus", "")), 44))
        nummerplaat = html.escape(_toon_waarde(bus.get("license_plate", "")))
        hansea_nummer = _toon_waarde(bus.get("hansea_id", ""))
        intern_nummer = html.escape(_toon_waarde(bus.get("intern_id", "")))
        in_dienst = html.escape(_format_status_datum(bus.get("id_date", ""), "Bus nog niet in dienst"))
        uit_dienst = html.escape(_format_status_datum(bus.get("ud_date", ""), "Bus nog in dienst"))
        volledige_eigenaar = html.escape(_toon_waarde(bus.get("owner", "")))

        extra_delen = []
        if toon_hansea:
            if hansea_nummer != "-":
                hansea_html = f'<span class="label">Hansea</span> <span class="hansea">{html.escape(hansea_nummer)}</span>'
            else:
                hansea_html = '<span class="label">Hansea</span> -'
            extra_delen.append(hansea_html)
        if toon_intern:
            extra_delen.append(f'<span class="label">Intern</span> {intern_nummer}')

        extra_html = ""
        if extra_delen:
            extra_html = '<div class="meta-right">' + '<span class="sep">|</span>'.join(extra_delen) + '</div>'

        eigenaar_html = ""
        if toon_volledige_eigenaar:
            eigenaar_html = f'<div class="eigenaar-lijn"><span class="label">Eigenaar</span> {volledige_eigenaar}</div>'

        kaarten.append(
            f"""
            <div class="buskaart">
              <div class="regel-boven">
                <div class="main">
                  <span class="nummer">{voertuignummer}</span>
                  <span class="type">{bus_type}</span>
                  <span class="plaat">{nummerplaat}</span>
                </div>
                {extra_html}
              </div>
              {eigenaar_html}
              <div class="regel-onder">
                <span><span class="label">In dienst</span> {in_dienst}</span>
                <span class="sep">|</span>
                <span><span class="label">Uit dienst</span> {uit_dienst}</span>
              </div>
            </div>
            """
        )

    titel = html.escape(eigenaar)
    subtitel = html.escape(f"{len(bussen)} voertuigen")
    vandaag = html.escape(_format_date_europees(date.today().strftime("%d/%m/%Y")))
    logo_data_uri = _haal_pdf_logo_data_uri()
    kleuren = PDF_THEMAS.get(thema, PDF_THEMAS["geel"])

    if toon_volledige_eigenaar:
        eerste_pagina_aantal = 9
        volgende_pagina_aantal = 10
    else:
        eerste_pagina_aantal = 11
        volgende_pagina_aantal = 13
    pagina_inhoud = []

    if kaarten:
        pagina_inhoud.append(kaarten[:eerste_pagina_aantal])
        resterend = kaarten[eerste_pagina_aantal:]
        for i in range(0, len(resterend), volgende_pagina_aantal):
            pagina_inhoud.append(resterend[i:i + volgende_pagina_aantal])

    totaal_paginas = len(pagina_inhoud) or 1
    paginas_html = []

    for index, kaarten_op_pagina in enumerate(pagina_inhoud or [[]], 1):
        if index == 1:
            logo_html = ""
            if logo_data_uri:
                logo_html = (
                    f'<a class="logo-link" href="{SITE_URL}">'
                    f'<img class="logo" src="{logo_data_uri}" alt="Busbibliotheek 95 logo">'
                    f'</a>'
                )
            header_html = f"""
            <div class="header hero">
              <div class="hero-band">
                <div class="hero-copy">
                  <a class="brand-link" href="{SITE_URL}">
                    <div class="eyebrow">Busbibliotheek 95</div>
                  </a>
                  <h1>{titel}</h1>
                  <div class="sub">{subtitel}</div>
                </div>
                {logo_html}
              </div>
              <div class="meta-strip">
                <span class="meta-label">Exportdatum</span>
                <span class="meta-value">{vandaag}</span>
              </div>
            </div>
            """
        else:
            header_html = f"""
            <div class="header vervolg">
              <div>
                <div class="mini-title">{titel}</div>
                <div class="sub">Vervolg overzicht</div>
              </div>
              <div class="meta-chip">{vandaag}</div>
            </div>
            """

        paginas_html.append(
            f"""
            <section class="page">
              <div class="page-inner">
                {header_html}
                <div class="kaarten">
                  {''.join(kaarten_op_pagina)}
                </div>
                <div class="page-footer">
                  <span>Busbibliotheek 95</span>
                  <span>Pagina {index} / {totaal_paginas}</span>
                </div>
              </div>
            </section>
            """
        )

    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>Bussen van eigenaar: {titel}</title>
  <style>
    @page {{
      size: A4;
      margin: 0;
    }}
    body {{
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      background: {kleuren["page_bg"]};
      margin: 0;
      font-size: 10pt;
    }}
    .page {{
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      padding: 12mm;
      page-break-after: always;
      break-after: page;
    }}
    .page:last-child {{
      page-break-after: auto;
      break-after: auto;
    }}
    .page-inner {{
      height: 100%;
      box-sizing: border-box;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.96));
      border-radius: 22px;
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
      padding: 7mm 7mm 6mm 7mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid {kleuren["card_line"]};
    }}
    .header {{
      margin-bottom: 4.6mm;
    }}
    .hero-band {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8mm;
      padding: 6mm 6.2mm 5.4mm 6.2mm;
      border-radius: 16px;
      background: linear-gradient(145deg, {kleuren["accent"]}, {kleuren["accent_soft"]});
    }}
    .hero-copy {{
      min-width: 0;
    }}
    .eyebrow {{
      display: inline-block;
      margin-bottom: 3mm;
      padding: 1.3mm 3.4mm;
      border-radius: 999px;
      background: rgba(255,255,255,0.2);
      color: #ffffff;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }}
    .brand-link, .logo-link {{
      text-decoration: none;
    }}
    h1 {{
      margin: 0 0 2.8mm 0;
      font-size: 23pt;
      color: #ffffff;
      letter-spacing: 0.1px;
      line-height: 1.1;
    }}
    .sub {{
      color: rgba(255,255,255,0.9);
      font-size: 10.4pt;
      font-weight: 600;
    }}
    .meta-strip {{
      margin-top: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3.2mm 4.2mm;
      border-radius: 12px;
      background: rgba(255,255,255,0.82);
      border: 1px solid {kleuren["card_line"]};
    }}
    .meta-label {{
      color: #64748b;
      font-size: 9.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }}
    .meta-value {{
      color: #0f172a;
      font-size: 10pt;
      font-weight: 700;
    }}
    .logo {{
      width: 19mm;
      height: 19mm;
      object-fit: contain;
      flex: 0 0 auto;
      background: rgba(255,255,255,0.96);
      border-radius: 14px;
      padding: 2.4mm;
    }}
    .vervolg {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4mm 4.4mm;
      border-radius: 14px;
      background: rgba(255,255,255,0.82);
      border: 1px solid {kleuren["card_line"]};
    }}
    .mini-title {{
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
    }}
    .meta-chip {{
      padding: 1.6mm 3.2mm;
      border-radius: 999px;
      background: {kleuren["badge_bg"]};
      color: {kleuren["badge_fg"]};
      font-size: 9pt;
      font-weight: 700;
    }}
    .kaarten {{
      flex: 1;
      overflow: hidden;
      display: grid;
      gap: 2.4mm;
    }}
    .buskaart {{
      border: 1px solid {kleuren["card_line"]};
      border-radius: 14px;
      padding: 3.2mm 3.6mm;
      background: rgba(255,255,255,0.92);
      page-break-inside: avoid;
      break-inside: avoid;
    }}
    .regel-boven {{
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: baseline;
      flex-wrap: wrap;
      margin-bottom: 0.8mm;
    }}
    .main {{
      display: flex;
      flex-wrap: wrap;
      gap: 2.6mm;
      align-items: baseline;
    }}
    .nummer {{
      font-weight: 700;
      font-size: 11pt;
      color: #0f172a;
      min-width: 16mm;
    }}
    .type {{
      font-weight: 600;
      color: #1e293b;
    }}
    .plaat {{
      color: #475569;
    }}
    .meta-right, .regel-onder {{
      color: #475569;
      font-size: 9pt;
    }}
    .eigenaar-lijn {{
      margin: 1.1mm 0;
      color: #475569;
      font-size: 9pt;
    }}
    .label {{
      font-weight: 700;
      color: #334155;
    }}
    .hansea {{
      color: #c62828;
      font-weight: 700;
    }}
    .sep {{
      margin: 0 2.2mm;
      color: #94a3b8;
    }}
    .page-footer {{
      margin-top: auto;
      padding-top: 3.4mm;
      padding-bottom: 1mm;
      border-top: 1px solid {kleuren["accent_soft"]};
      font-size: 9pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }}
  </style>
</head>
<body>
  {''.join(paginas_html)}
</body>
</html>
"""


def _save_html_als_pdf(bestandspad, html_inhoud):
    """Maak een PDF via Microsoft Edge headless."""
    edge = _edge_pad()
    if not edge:
        raise RuntimeError("Microsoft Edge niet gevonden")

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        tmp.write(html_inhoud)
        tmp_pad = tmp.name

    try:
        subprocess.run(
            [
                edge,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={bestandspad}",
                tmp_pad,
            ],
            check=True,
            timeout=60,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        if os.path.exists(tmp_pad):
            os.remove(tmp_pad)


def _kies_bus_bij_meerdere_voertuignummers(zoekterm, matches):
    """Laat de gebruiker kiezen tussen meerdere bussen met hetzelfde zichtbare nummer."""
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]

    print(f"\n{YELLOW}[INFO]{RESET} Meerdere bussen gevonden met nummer '{zoekterm}':")
    for i, bus in enumerate(matches, 1):
        bus_type = bus.get("bus", "").strip() or "Onbekend type"
        kenteken = bus.get("license_plate", "").strip()
        keuze_regel = f"  {i}. {bus_type}"
        if kenteken and kenteken != "/":
            keuze_regel += f" ({kenteken})"
        print(keuze_regel)

    try:
        keuze = input(f"Over welk type gaat het? (1-{len(matches)}): ").strip()
        idx = int(keuze) - 1
        if 0 <= idx < len(matches):
            return matches[idx]
    except (ValueError, IndexError):
        pass

    return None


def _split_meervoudige_waarden(waarde):
    """Splits komma-gescheiden waarden en verwijdert lege onderdelen."""
    if not waarde or waarde == "/":
        return []
    return [deel.strip() for deel in waarde.split(",") if deel.strip()]


def _normaliseer_zoekwaarde(waarde):
    """Maak een waarde vergelijkbaar voor deelzoekingen."""
    waarde = (waarde or "").strip().casefold()
    for teken in (" ", "-", ".", "/", "(", ")"):
        waarde = waarde.replace(teken, "")
    return waarde


def _bus_exacte_zoekwaarden(bus):
    """Verzamel alle waarden die als exacte zoekterm mogen werken."""
    waarden = []

    vehicle_id = bus.get("vehicle_id", "").strip()
    if vehicle_id:
        waarden.append(vehicle_id)
        zichtbaar_nummer = _toon_voertuignummer(vehicle_id)
        if zichtbaar_nummer:
            waarden.append(zichtbaar_nummer)

    for veld in ("license_plate", "hansea_id", "intern_id"):
        waarde = bus.get(veld, "").strip()
        if waarde and waarde != "/":
            waarden.append(waarde)

    waarden.extend(_split_meervoudige_waarden(bus.get("old_vehicle_id", "")))
    waarden.extend(_split_meervoudige_waarden(bus.get("old_license_plate", "")))
    return {_normaliseer_zoekwaarde(waarde) for waarde in waarden if _normaliseer_zoekwaarde(waarde)}


def _deelzoekscore(bus, zoekterm_norm):
    """Geef een score terug voor deelzoeking; lager is beter."""
    kandidaten = [
        (0, _toon_voertuignummer(bus.get("vehicle_id", "").strip())),
        (1, bus.get("vehicle_id", "")),
        (2, bus.get("license_plate", "")),
        (3, bus.get("hansea_id", "")),
        (4, bus.get("intern_id", "")),
        (5, bus.get("old_vehicle_id", "")),
        (6, bus.get("old_license_plate", "")),
        (7, bus.get("owner", "")),
        (8, bus.get("bus", "")),
    ]

    beste_score = None
    for prioriteit, waarde in kandidaten:
        waarde_norm = _normaliseer_zoekwaarde(waarde)
        if not waarde_norm:
            continue
        if waarde_norm == zoekterm_norm:
            score = (0, prioriteit, len(waarde_norm))
        elif waarde_norm.startswith(zoekterm_norm):
            score = (1, prioriteit, len(waarde_norm))
        elif zoekterm_norm in waarde_norm:
            score = (2, prioriteit, len(waarde_norm))
        else:
            continue
        if beste_score is None or score < beste_score:
            beste_score = score
    return beste_score


def _bus_keuzelabel(bus):
    """Maak een korte, leesbare beschrijving van een bus voor keuzelijsten."""
    voertuignummer = _toon_waarde(_toon_voertuignummer(bus.get("vehicle_id", "").strip()))
    bus_type = _toon_waarde(bus.get("bus", ""), "Onbekend type")
    nummerplaat = _toon_waarde(bus.get("license_plate", ""))
    eigenaar = _toon_waarde(bus.get("owner", ""))
    return f"{voertuignummer} | {bus_type} | {nummerplaat} | {eigenaar}"


def _kies_bus_uit_zoekresultaten(zoekterm, matches):
    """Laat de gebruiker kiezen uit meerdere deelzoekresultaten."""
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]

    print(f"\n{YELLOW}[INFO]{RESET} {len(matches)} resultaten gevonden voor '{zoekterm}':")
    for i, bus in enumerate(matches, 1):
        print(f"  {i}. {_bus_keuzelabel(bus)}")

    while True:
        keuze = input(f"Kies een bus (1-{len(matches)}) of druk Enter om te annuleren: ").strip()
        if not keuze:
            return None
        try:
            idx = int(keuze) - 1
            if 0 <= idx < len(matches):
                return matches[idx]
        except ValueError:
            pass
        print(f"{RED}[ERROR]{RESET} Typ een geldig nummer of druk Enter om te annuleren.")


def zoek_bussen_deels(zoekterm, data, maximum=20):
    """Zoek bussen via een deel van relevante velden."""
    if not data:
        return []

    zoekterm_norm = _normaliseer_zoekwaarde(zoekterm)
    if not zoekterm_norm:
        return []

    matches = []
    geziene_bussen = set()

    for bus in data:
        sleutel = _bus_sleutel(bus)
        if sleutel in geziene_bussen:
            continue
        score = _deelzoekscore(bus, zoekterm_norm)
        if score is not None:
            matches.append((score, bus))
            geziene_bussen.add(sleutel)

    matches.sort(key=lambda item: (item[0], _voertuignummer_sorteersleutel(item[1])))
    return [bus for _, bus in matches[:maximum]]


def _zoek_bus_exact(zoekterm, data):
    """Zoek een bus via exacte match op ondersteunde velden."""
    if not data:
        return None

    zoekterm_norm = _normaliseer_zoekwaarde(zoekterm)
    if not zoekterm_norm:
        return None

    voertuig_matches = []
    for bus in data:
        vehicle_id = bus.get("vehicle_id", "").strip()
        zichtbaar_nummer = _toon_voertuignummer(vehicle_id)
        kandidaten = {
            _normaliseer_zoekwaarde(vehicle_id),
            _normaliseer_zoekwaarde(zichtbaar_nummer),
        }
        kandidaten.discard("")
        if zoekterm_norm in kandidaten:
            voertuig_matches.append(bus)

    unieke_voertuig_matches = []
    geziene_ids = set()
    for bus in voertuig_matches:
        unieke_sleutel = _bus_sleutel(bus)
        if unieke_sleutel not in geziene_ids:
            unieke_voertuig_matches.append(bus)
            geziene_ids.add(unieke_sleutel)

    if unieke_voertuig_matches:
        return _kies_bus_bij_meerdere_voertuignummers(zoekterm, unieke_voertuig_matches)

    for bus in data:
        if zoekterm_norm in _bus_exacte_zoekwaarden(bus):
            return bus

    return None


def _zoek_bus_interactief(zoekterm, data, toon_meldingen=True):
    """Zoek eerst exact en val daarna terug op deelzoeking."""
    bus = _zoek_bus_exact(zoekterm, data)
    if bus:
        return bus

    matches = zoek_bussen_deels(zoekterm, data)
    if not matches:
        return None

    if toon_meldingen:
        print(f"{YELLOW}[INFO]{RESET} Geen exacte match gevonden. Deelzoeking wordt gebruikt.")
    return _kies_bus_uit_zoekresultaten(zoekterm, matches)


def _print_eigenaarslijst(eigenaars):
    """Toon de beschikbare eigenaars."""
    print(f"\n{YELLOW}[INFO]{RESET} Kies een eigenaar:")
    for i, eigenaar in enumerate(eigenaars, 1):
        print(f"  {i}. {eigenaar}")


def _kies_eigenaar_op_basis_van_invoer(keuze, eigenaars):
    """Zet gebruikersinvoer om naar een eigenaar uit de lijst."""
    try:
        idx = int(keuze) - 1
        if 0 <= idx < len(eigenaars):
            return eigenaars[idx]
    except ValueError:
        pass
    return None


def _maak_eigenaar_rapport(eigenaar, data, include_retired=True, removed_bussen=None, extra_bussen=None):
    """Bouw de rapporttekst voor een eigenaar op en geef die terug als string."""
    lijnen = []
    bussen, toon_hansea, toon_intern = _eigenaar_dataset(
        eigenaar,
        data,
        include_retired=include_retired,
        removed_bussen=removed_bussen,
        extra_bussen=extra_bussen,
    )
    if not bussen:
        return None

    tabel_breedte = 104
    toon_volledige_eigenaar = _toon_volledige_eigenaar_in_pdf(eigenaar)

    lijnen.append("")
    lijnen.append("="*tabel_breedte)
    lijnen.append(f"Bussen van eigenaar: {eigenaar}")
    lijnen.append("="*tabel_breedte)

    for bus in bussen:
        voertuignummer = _toon_waarde(_toon_voertuignummer(bus.get("vehicle_id", "").strip()))
        bus_type = _toon_waarde(bus.get("bus", ""))
        nummerplaat = _toon_waarde(bus.get("license_plate", ""))
        hansea_nummer = _toon_waarde(bus.get("hansea_id", ""))
        intern_nummer = _toon_waarde(bus.get("intern_id", ""))
        in_dienst = _format_status_datum(bus.get("id_date", ""), "Bus nog niet in dienst")
        uit_dienst = _format_status_datum(bus.get("ud_date", ""), "Bus nog in dienst")

        regel_1 = (
            f"{_kort(voertuignummer, 8)} | "
            f"{_kort(bus_type, 36)} | "
            f"{_kort(nummerplaat, 12)}"
        )
        if toon_hansea:
            hansea_weergave = _kort(hansea_nummer, 8)
            if hansea_nummer != "-":
                hansea_weergave = _maak_rood(hansea_weergave)
            regel_1 += f" | Hansea: {hansea_weergave}"
        if toon_intern:
            regel_1 += f" | Intern: {_kort(intern_nummer, 8)}"

        lijnen.append(regel_1)
        if toon_volledige_eigenaar:
            lijnen.append(f"{' ' * 11} Eigenaar: {_toon_waarde(bus.get('owner', ''))}")
        regel_2 = f"{' ' * 8}   In dienst: {in_dienst} | Uit dienst: {uit_dienst}"

        lijnen.append(regel_2)
        lijnen.append("-"*tabel_breedte)

    lijnen.append("="*tabel_breedte)
    lijnen.append("")
    return "\n".join(lijnen)


def print_bussen_van_eigenaar(eigenaar, data):
    """Toon alle bussen van een gekozen eigenaar in compacte lijstvorm."""
    rapport = _maak_eigenaar_rapport(eigenaar, data)
    if not rapport:
        print(f"{YELLOW}[INFO]{RESET} Geen bussen gevonden voor eigenaar '{eigenaar}'.\n")
        return None
    print(rapport)
    return rapport


def _vraag_uit_dienst_meenemen():
    """Vraag of uit dienst bussen mee moeten in de export."""
    while True:
        keuze = input("Moeten bussen die uit dienst zijn ook in de PDF staan? (ja/nee): ").strip().lower()
        if keuze in {"ja", "j"}:
            return True
        if keuze in {"nee", "n"}:
            return False
        print(f"{RED}[ERROR]{RESET} Typ 'ja' of 'nee'.")


def _vraag_pdf_themakleur():
    """Laat de gebruiker een themakleur kiezen voor de PDF."""
    keuzes = ["wit", "geel", "groen", "blauw", "oranje", "rood", "paars"]
    print(f"\n{YELLOW}[INFO]{RESET} Kies een kleurthema voor de PDF:")
    for i, kleur in enumerate(keuzes, 1):
        print(f"  {i}. {kleur.capitalize()}")

    while True:
        keuze = input(f"Welke kleur wens je? (1-{len(keuzes)}): ").strip()
        try:
            idx = int(keuze) - 1
            if 0 <= idx < len(keuzes):
                return keuzes[idx]
        except ValueError:
            pass
        print(f"{RED}[ERROR]{RESET} Typ een geldig nummer.")


def _bus_korte_omschrijving(bus):
    """Korte omschrijving voor bevestigingsvragen."""
    voertuignummer = _toon_waarde(_toon_voertuignummer(bus.get("vehicle_id", "").strip()))
    bus_type = _toon_waarde(bus.get("bus", ""))
    eigenaar = _toon_waarde(bus.get("owner", ""))
    return f"{voertuignummer} - {bus_type} ({eigenaar})"


def _vraag_bevestiging(vraag):
    """Algemene bevestigingsvraag."""
    while True:
        keuze = input(vraag).strip().lower()
        if keuze in {"ja", "j"}:
            return True
        if keuze in {"nee", "n"}:
            return False
        print(f"{RED}[ERROR]{RESET} Typ 'ja' of 'nee'.")


def _pas_pdf_bussen_aan(eigenaar, data):
    """Laat de gebruiker individueel bussen verwijderen of toevoegen voor de PDF."""
    removed_bussen = set()
    extra_bussen = []

    if not _vraag_bevestiging("Wil je individueel bussen verwijderen of toevoegen voor de PDF? (ja/nee): "):
        return removed_bussen, extra_bussen

    while True:
        actie = input("Typ 'verwijderen', 'toevoegen' of 'klaar': ").strip().lower()
        if actie == "klaar":
            return removed_bussen, extra_bussen
        if actie not in {"verwijderen", "toevoegen"}:
            print(f"{RED}[ERROR]{RESET} Typ 'verwijderen', 'toevoegen' of 'klaar'.")
            continue

        voertuignummer = input("Welk voertuignummer wilt u gebruiken? ").strip()
        if not voertuignummer:
            print(f"{RED}[ERROR]{RESET} Er werd geen voertuignummer ingevuld.")
            continue

        bus = _zoek_bus_interactief(voertuignummer, data)
        if not bus:
            print(f"{YELLOW}[INFO]{RESET} Er werd geen bus gevonden met '{voertuignummer}'.")
            continue

        omschrijving = _bus_korte_omschrijving(bus)
        if not _vraag_bevestiging(f"Bevestig {actie} van '{omschrijving}'? (ja/nee): "):
            continue

        bus_id = _bus_sleutel(bus)
        if actie == "verwijderen":
            removed_bussen.add(bus_id)
            extra_bussen = [extra for extra in extra_bussen if _bus_sleutel(extra) != bus_id]
            print(f"{GREEN}[OK]{RESET} Deze bus wordt niet opgenomen in de PDF.")
        else:
            extra_bussen = [extra for extra in extra_bussen if _bus_sleutel(extra) != bus_id]
            extra_bussen.append(bus)
            removed_bussen.discard(bus_id)
            print(f"{GREEN}[OK]{RESET} Deze bus wordt toegevoegd aan de PDF.")


def _save_eigenaar_rapport(eigenaar, data):
    """Sla het huidige eigenaarsrapport op in Downloads, liefst als PDF."""
    if not eigenaar:
        print(f"{YELLOW}[INFO]{RESET} Toon eerst een eigenaarslijst voor je opslaat.\n")
        return

    include_retired = _vraag_uit_dienst_meenemen()
    thema = _vraag_pdf_themakleur()
    removed_bussen, extra_bussen = _pas_pdf_bussen_aan(eigenaar, data)
    rapport = _maak_eigenaar_rapport(
        eigenaar,
        data,
        include_retired=include_retired,
        removed_bussen=removed_bussen,
        extra_bussen=extra_bussen,
    )
    if not rapport:
        print(f"{YELLOW}[INFO]{RESET} Geen bussen gevonden voor deze exportkeuze.\n")
        return

    map_pad = _standaard_downloadsmap()
    basisnaam = _veilige_bestandsnaam(f"Bussen van {eigenaar}")
    pdf_pad = os.path.join(map_pad, f"{basisnaam}.pdf")
    txt_pad = os.path.join(map_pad, f"{basisnaam}.txt")

    try:
        html_inhoud = _maak_eigenaar_html(
            eigenaar,
            data,
            include_retired=include_retired,
            removed_bussen=removed_bussen,
            extra_bussen=extra_bussen,
            thema=thema,
        )
        if not html_inhoud:
            raise RuntimeError("Geen rapportdata beschikbaar")
        _save_html_als_pdf(pdf_pad, html_inhoud)
        print(f"{GREEN}[OK]{RESET} Opgeslagen als PDF in Downloads: {pdf_pad}\n")
        if hasattr(os, "startfile"):
            try:
                os.startfile(pdf_pad)
            except OSError:
                pass
    except Exception as e:
        try:
            with open(txt_pad, "w", encoding="utf-8") as f:
                f.write(rapport)
            print(f"{YELLOW}[INFO]{RESET} PDF opslaan lukte niet ({e}).")
            print(f"{GREEN}[OK]{RESET} Opgeslagen als TXT in Downloads: {txt_pad}\n")
        except Exception as txt_fout:
            print(f"{RED}[ERROR]{RESET} Kon bestand niet opslaan: {txt_fout}\n")


def _eigenaar_modus(data):
    """Blijf in eigenaarsmodus tot de gebruiker expliciet stopt."""
    eigenaars = _beschikbare_eigenaars(data)
    if not eigenaars:
        print(f"{YELLOW}[INFO]{RESET} Geen eigenaars gevonden in de data.\n")
        return

    huidige_eigenaar = None
    _print_eigenaarslijst(eigenaars)

    while True:
        if huidige_eigenaar:
            prompt = f"Huidige eigenaar: {huidige_eigenaar} | Kies een nummer, of typ 'save', 'lijst' of 'stop': "
        else:
            prompt = "Kies nummer, of typ 'lijst' of 'stop': "

        keuze = input(prompt).strip()

        keuze_lower = keuze.lower()

        if keuze_lower == "stop":
            print(f"{YELLOW}[INFO]{RESET} Eigenaarsmodus afgesloten.\n")
            return
        if keuze_lower == "lijst":
            _print_eigenaarslijst(eigenaars)
            continue
        if keuze_lower == "save":
            if not huidige_eigenaar:
                print(f"{YELLOW}[INFO]{RESET} Kies eerst een eigenaar voor je 'save' gebruikt.\n")
                continue
            _save_eigenaar_rapport(huidige_eigenaar, data)
            continue

        eigenaar = _kies_eigenaar_op_basis_van_invoer(keuze, eigenaars)
        if not eigenaar:
            if huidige_eigenaar:
                melding = "Typ een geldig nummer, 'save', 'lijst' of 'stop'."
            else:
                melding = "Typ een geldig nummer, 'lijst' of 'stop'."
            print(f"{RED}[ERROR]{RESET} Ongeldige keuze. {melding}\n")
            continue

        huidige_eigenaar = eigenaar
        print_bussen_van_eigenaar(eigenaar, data)


def zoek_bus(zoekterm, data):
    """Zoek een bus op vehicle_id, license_plate, hansea_id of oude nummers."""
    return _zoek_bus_exact(zoekterm, data)


def _format_date_europees(datum):
    if not datum or datum == "/" or datum.strip() == "":
        return ""
    try:
        dag, maand, jaar = datum.strip().split("/")
        maand_namen = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"]
        m = int(maand) - 1
        if m < 0 or m >= len(maand_namen):
            return datum
        return f"{int(dag)} {maand_namen[m]} {jaar}"
    except Exception:
        return datum


def _print_veld(label, waarde, rood=False):
    """Helper om een veld netjes te printen."""
    if rood:
        waarde = f"\033[91m{waarde}\033[0m"
    print(f"  {label:.<30} {waarde}")


def print_info(bus):
    """Print busgegevens in een leesbare format."""
    print("\n" + "="*70)
    print("Voertuiginformatie")
    print("="*70)

    vin_verborgen = bus.get("hide-vin", "").strip() == "1"

    bus_type = bus.get("bus", "").strip()
    voertuignummer = bus.get("vehicle_id", "").strip()

    if bus_type:
        _print_veld("Type", bus_type)
    if voertuignummer:
        _print_veld("Voertuignummer", _toon_voertuignummer(voertuignummer))

    veld_mapping = {
        "license_plate": "Nummerplaat",
        "id_date": "In dienst",
        "ud_date": "Uit dienst",
        "owner": "Eigenaar",
        "hansea_id": "Hansea nummer",
        "intern_id": "Intern nummer",
        "spotted": "Gespot?",
        "VIN": "VIN-nummer",
        "hide-vin": "VIN verbergen?",
        "old_vehicle_id": "Oude voertuignummers",
        "old_license_plate": "Oude nummerplaten",
    }

    # Verberg bepaalde velden
    if vin_verborgen:
        te_verbergen = ["VIN", "hide-vin"]
    else:
        te_verbergen = ["hide-vin"]

    # Controleer of bus nog niet in dienst is
    id_date_waarde = bus.get("id_date", "").strip()
    bus_nog_niet_in_dienst = not id_date_waarde or id_date_waarde == "/"

    for csv_veld, label in veld_mapping.items():
        if csv_veld in te_verbergen:
            continue

        # Als bus nog niet in dienst is, skip 'ud_date'
        if csv_veld == "ud_date" and bus_nog_niet_in_dienst:
            continue

        waarde = bus.get(csv_veld, "").strip()

        if csv_veld == "id_date":
            # In dienst: speciale logica
            if bus_nog_niet_in_dienst:
                waarde = "Bus nog niet in dienst"
            else:
                waarde = _format_date_europees(waarde)
                if not waarde:
                    continue
        elif csv_veld == "ud_date":
            # Uit dienst: altijd tonen
            if not waarde or waarde == "/":
                waarde = "Bus nog in dienst"
            else:
                waarde = _format_date_europees(waarde)
                if not waarde:
                    waarde = "Bus nog in dienst"
        else:
            # Andere velden
            if not waarde or waarde in ["/", "0", ""]:
                continue
        
        if csv_veld == "spotted":
            waarde = "Ja" if waarde == "1" else "Nee"
        elif csv_veld == "hide-vin":
            waarde = "Ja" if waarde == "1" else "Nee"
        rood = csv_veld == "hansea_id" and waarde != "/"
        _print_veld(label, waarde, rood)

    print("="*70 + "\n")


def _print_intro():
    """Print introductie tekst."""
    _print_header()
    _print_welkom()
    print(f"\nBusbibliotheek 95 (Python editie)")
    print("-" * 70)
    print("U kunt zoeken op voertuignummer, nummerplaat, intern nummer en meer.")
    print("Deelzoeking werkt ook: bv. stukje nummerplaat, eigenaar of bustype.")
    print("Typ 'eigenaar' voor een overzicht per eigenaar.")
    print("Typ 'update' om de databank te vernieuwen of 'site' om de website te openen.\n")


def main():
    """Hoofdprogramma."""
    data = load_data()

    if not data:
        print(f"{RED}[ERROR]{RESET} Geen busdata geladen. Controleer je bestand.")
        return

    _print_intro()

    while True:
        zoekterm = input("[ZOEK] Voer uw zoekopdracht in: ").strip()

        if zoekterm.lower() == 'exit':
            print(f"\n{GREEN}[EXIT]{RESET} Programma gestopt.")
            break

        elif zoekterm.lower() == 'update':
            nieuwe_data = update_data()
            if nieuwe_data:
                data = nieuwe_data
                print(f"{GREEN}[OK]{RESET} De data werd bijgewerkt. U kunt nu zoeken met de nieuwste versie.\n")
            else:
                print(f"{RED}[ERROR]{RESET} De data werd niet bijgewerkt. De vorige versie blijft in gebruik.\n")
            continue
        
        elif zoekterm.lower() == 'site':
            webbrowser.open('https://sites.google.com/view/delijn-busspotter')
            print(f"{BLUE}[INFO]{RESET} De website werd geopend in uw standaardbrowser.\n")
            continue
        
        elif zoekterm.lower() == 'eigenaar':
            _eigenaar_modus(data)
            continue

        if not zoekterm:
            print(f"{YELLOW}[INFO]{RESET} Lege invoer, probeer opnieuw.\n")
            continue

        bus = zoek_bus(zoekterm, data)

        if bus:
            print_info(bus)
        else:
            gekozen_bus = _zoek_bus_interactief(zoekterm, data, toon_meldingen=True)
            if gekozen_bus:
                print_info(gekozen_bus)
            else:
                print(f"{YELLOW}[INFO]{RESET} Geen bus gevonden met '{zoekterm}'.\n")

if __name__ == "__main__":
    main()

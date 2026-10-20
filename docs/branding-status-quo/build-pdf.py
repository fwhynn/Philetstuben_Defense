from pathlib import Path
from html import escape
from lxml import html
import re,json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
TMP=ROOT/'tmp/pdfs'; TMP.mkdir(parents=True,exist_ok=True)
for name,file in [('UI','arial.ttf'),('UI-Bold','arialbd.ttf'),('Title','georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('UI',normal='UI',bold='UI-Bold',italic='UI',boldItalic='UI-Bold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyUI',fontName='UI',fontSize=9.5,leading=14,spaceAfter=8,textColor=colors.HexColor('#223329')))
styles.add(ParagraphStyle(name='CellUI',parent=styles['BodyUI'],fontSize=8,leading=11,spaceAfter=0,wordWrap='CJK'))
styles.add(ParagraphStyle(name='HeadUI',fontName='Title',fontSize=23,leading=29,spaceAfter=18,textColor=colors.HexColor('#24342a'),keepWithNext=True))
styles.add(ParagraphStyle(name='SubUI',fontName='UI-Bold',fontSize=12,leading=17,spaceBefore=12,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='Cover',fontName='Title',fontSize=36,leading=43,textColor=colors.HexColor('#24342a'),spaceAfter=22))
def text(e):
    return re.sub(r'\s+',' ',e.text_content()).strip().replace('≤','<= ').replace('≥','>= ').replace('→',' > ').replace('–','-').replace('—','-').replace('\u2011','-')
def para(t,style='BodyUI'):
    return Paragraph(escape(t),styles[style])
story=[]
story += [Spacer(1,60),para('AUTOHEX TD','SubUI'),para('UI & Branding Guide','Cover'),
          para('Status quo - Designerfassung','HeadUI'),para('20. Oktober 2026 | Quellstand vor Release 1.0.8'),
          Spacer(1,28),para('Schriften, Farben, Controls, Menüs, Effekte und responsive Regeln des bestehenden Spiels.'),
          para('Dieser Guide dokumentiert den lokalen Implementierungsstand einschließlich der für den Release vorbereiteten Änderungen. Er definiert noch kein neues Design.'),
          Spacer(1,24),para('Verwendung','SubUI'),
          para('Die folgenden Kapitel enthalten die lesbare Bestandsaufnahme. Das vollständige durchsuchbare HTML-Regelverzeichnis und das JSON-Inventar sind als Dateianhänge in dieser PDF eingebettet. PDF-Reader mit Anhangsfunktion können sie extrahieren; einfache Browser-Viewer zeigen Anhänge unter Umständen nicht an.'),
          para('Keine Browservermessung: Pixelangaben sind CSS-Deklarationen, keine gemessenen Endgrößen. Layout, Kaskade und JavaScript können sie verändern.'),
          PageBreak()]
doc=html.fromstring(HERE.joinpath('guide-content.html').read_text(encoding='utf8'))
sections=doc.xpath('//section')
story.append(para('Inhalt','HeadUI'))
for s in sections: story.append(para(text(s.find('h2'))))
story += [para('12 - CSS-Variablen und technische Anlagen'),PageBreak()]
def walk(e):
    tag=e.tag
    if tag in ['h2','h3']: story.append(para(text(e),'HeadUI' if tag=='h2' else 'SubUI'))
    elif tag=='p': story.append(para(text(e)))
    elif tag in ['ul','ol']:
        for i,li in enumerate(e.findall('li')):story.append(para((str(i+1)+'. ' if tag=='ol' else '- ')+text(li)))
    elif tag=='table':
        rows=e.xpath('./tr|./thead/tr|./tbody/tr')
        cells=[[para(text(c),'CellUI') for c in row if c.tag in ['td','th']] for row in rows]
        n=max(map(len,cells)); widths=([115,190,194] if n==3 else [155,344]) if n in [2,3] else [499/n]*n
        t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e2e9df')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f6f1')]),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#c7d0c4')),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        story.extend([t,Spacer(1,12)])
    elif tag=='div' and 'samples' in e.get('class',''):
        story.append(para('Stilmuster: grüne Hauptaktion #326345, goldene Freischaltung #e9c86a > #b88f2e, Fokus #ffe198, epische Pergamentkarte mit Rand #8a40c0.'))
    elif tag=='div' and 'chips' in e.get('class',''):
        sw=[]
        for c in e:
            val=c.xpath('.//i/@style')[0].split(':')[-1]
            sw.append([para(text(c),'CellUI'),''])
        t=Table(sw,colWidths=[420,79])
        cmds=[('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]
        for i,c in enumerate(e):cmds.append(('BACKGROUND',(1,i),(1,i),colors.HexColor(c.xpath('.//i/@style')[0].split(':')[-1])))
        t.setStyle(TableStyle(cmds));story.extend([t,Spacer(1,12)])
    else:
        for child in e:walk(child)
for s in sections:
    walk(s);story.append(PageBreak())
story.append(para('12 - CSS-Variablen und Anlagen','HeadUI'))
inv=json.loads(HERE.joinpath('ui-inventory.json').read_text(encoding='utf8'))
story.append(para(f"Das eingebettete Inventar enthält {len(inv['rules'])} CSS-Regelblöcke, {len(inv['variables'])} Variablendeklarationen sowie {len(inv['inlineStyleCandidates'])} dynamische Style-Fundstellen. Quellstellen und Prüfsummen erlauben den Abgleich mit dem Code."))
rows=[[para('Token / Scope','CellUI'),para('Wert / Quelle','CellUI')]]
for v in inv['variables']:rows.append([para(v['name']+' | '+v['selector'],'CellUI'),para(v['value']+' | '+v['file']+':'+str(v['line']),'CellUI')])
t=Table(rows,colWidths=[240,259],repeatRows=1)
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e2e9df')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f6f1')]),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
story.append(t)
def footer(c,d):
    c.setStrokeColor(colors.HexColor('#d3b566'));c.line(48,46,547,46)
    c.setFont('UI',8);c.setFillColor(colors.HexColor('#526c56'));c.drawString(48,31,'AUTOHEX TD | UI & Branding | Status quo 20.10.2026');c.drawRightString(547,31,str(d.page))
raw=TMP/'branding-body.pdf'
SimpleDocTemplate(str(raw),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=48,bottomMargin=62,title='AutoHex TD - UI & Branding Guide',author='AutoHex TD').build(story,onFirstPage=footer,onLaterPages=footer)
w=PdfWriter();w.clone_document_from_reader(PdfReader(str(raw)))
for file in ['index.html','ui-inventory.json']:w.add_attachment(file,HERE.joinpath(file).read_bytes())
target=OUT/'AutoHex-TD-Branding-Guide.pdf'
with target.open('wb') as f:w.write(f)
print(json.dumps({'pages':len(w.pages),'output':str(target),'attachments':2}))

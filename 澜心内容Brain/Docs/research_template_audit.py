#!/usr/bin/env python3
"""Audit reviewed public templates and staged spreadsheets. Never reads research stores."""
from __future__ import annotations
import argparse
import hashlib
import io
import re
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FOLDER = '澜心内容Brain/Docs/研究模板/'
MATRIX = FOLDER + '04_六大主题与五类对标账号搜索矩阵.xlsx'
BOOK = FOLDER + '05_评论研究数据与选题判断工作簿.xlsx'
# Review certificates, not values to refresh automatically after editing.
REVIEWED = {
    MATRIX: 'e5867753f4bed9805323f32f9aee9557ff80f82b0e3f53b8a48114418a425a04',
    BOOK: 'c0bdab1981321d0ec8fa9d87096fc607438375bbb8466b32804dea2870fa316b',
}
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
DATA_SHEETS = {'批次记录', '搜索记录', '账号筛选', '笔记筛选', '评论证据',
               '问题归类', '问题评论关联', '选题判断', '平台预审', '推荐理由', '证据索引'}
ERRORS = {'#REF!', '#DIV/0!', '#VALUE!', '#NAME?', '#N/A', '#NUM!', '#NULL!', '#SPILL!', '#CALC!'}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def sheets(data):
    """Read formulas and values via OOXML; does not execute external content."""
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in
                ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        result = {}
        for s in ET.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS):
            target = rels[s.attrib['{' + NS['r'] + '}id']]
            path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            cells = {}
            for c in ET.fromstring(z.read(path)).findall('.//s:sheetData/s:row/s:c', NS):
                v = c.find('s:v', NS)
                value = v.text if v is not None and v.text is not None else ''
                if c.get('t') == 's' and value:
                    value = strings[int(value)]
                elif c.get('t') == 'inlineStr':
                    value = ''.join(c.find('s:is', NS).itertext())
                cells[c.attrib['r']] = (value, c.find('s:f', NS) is not None)
            result[s.attrib['name']] = (s.get('state', 'visible'), cells)
        return result


def blank_failures(parsed):
    failures = []
    for name, (_, cells) in parsed.items():
        if name in DATA_SHEETS:
            for address, (value, formula) in cells.items():
                if int(re.search(r'\d+', address)[0]) >= 6 and value and not formula:
                    failures.append(f'nonblank research input: {name}!{address}')
        if name == '本轮汇总':
            for address in ('B4', 'B5', 'B6'):
                if cells.get(address, ('', False))[0]:
                    failures.append(f'nonblank RUN input: {name}!{address}')
    return failures


def audit(name, data):
    failures = []
    if name not in REVIEWED:
        return ['spreadsheet is not an approved public template: ' + name]
    if hashlib.sha256(data).hexdigest() != REVIEWED[name]:
        failures.append('reviewed digest changed; requires fresh review: ' + name)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for entry in z.namelist():
            if any(x in entry for x in ('vbaProject', '/embeddings/', '/media/', 'externalLinks/',
                                       'comments', 'customXml/')):
                failures.append('unexpected embedded/external material: ' + entry)
            if entry.endswith('.rels'):
                for rel in ET.fromstring(z.read(entry)):
                    if rel.get('TargetMode') == 'External':
                        failures.append('external relationship: ' + entry)
    parsed = sheets(data)
    for title, (state, cells) in parsed.items():
        if state != 'visible':
            failures.append('hidden sheet: ' + title)
        if any(value in ERRORS for value, _ in cells.values()):
            failures.append('cached formula error: ' + title)
    if name == BOOK:
        if len(parsed) != 13 or not DATA_SHEETS.issubset(parsed):
            failures.append('unexpected workbook sheets')
        failures.extend(blank_failures(parsed))
        if sum(formula for _, cells in parsed.values() for _, formula in cells.values()) != 3458:
            failures.append('unexpected formula count')
    else:
        cells = parsed['三十组对应矩阵'][1]
        routes = {(cells[f'B{i}'][0], cells[f'C{i}'][0]) for i in range(6, 36)}
        themes = {a for a, _ in routes}
        sources = {b for _, b in routes}
        if len(parsed) != 5 or len(themes) != 6 or len(sources) != 5 or len(routes) != 30:
            failures.append('incomplete six-by-five matrix')
    return failures


def check():
    failures = []
    for name in REVIEWED:
        path = ROOT / name
        failures.extend(audit(name, path.read_bytes()) if path.exists() else ['missing template: ' + name])
    # Staged bytes may differ from working-tree bytes: examine index separately.
    for name in git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').decode().split('\0'):
        if name.lower().endswith(('.xlsx', '.xlsm', '.xls', '.csv', '.tsv')):
            failures.extend(audit(name, git('show', ':' + name)))
    for failure in failures:
        print('FAIL:', failure)
    if not failures:
        print('PASS: reviewed public template digests, 30 routes, 13-sheet blank inputs, 3458 formulas, package contents and staged spreadsheet allowlist.')
        print('LIMIT: this rejects changes to approved templates; it does not authorize real research data for public use.')
    return int(bool(failures))


def self_test():
    parsed = sheets((ROOT / BOOK).read_bytes())
    assert not blank_failures(parsed)
    parsed['评论证据'][1]['A6'] = ('SIMULATED-O1', False)
    assert blank_failures(parsed)
    assert audit('ResearchRuns/simulated.xlsx', b'not a workbook')
    assert audit(BOOK, (ROOT / BOOK).read_bytes() + b'\n')
    ignored = subprocess.run(['git', 'check-ignore', '--no-index', 'ResearchRuns/simulated.xlsx',
                              'other-simulated.xlsx'], cwd=ROOT, capture_output=True, text=True)
    assert ignored.returncode == 0 and len(ignored.stdout.splitlines()) == 2
    print('PASS: filled approved-template cell, changed digest and non-allowlisted workbook rejected; actual-workbook paths ignored. Simulated only; no files written.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('check', 'self-test'), default='check', nargs='?')
    args = parser.parse_args()
    if args.command == 'self-test':
        self_test()
    else:
        raise SystemExit(check())

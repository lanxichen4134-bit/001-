#!/usr/bin/env python3
"""Generate reading copies and audit the framework. No network or business actions.

Run from any directory: python3 framework_tools.py sync | check | self-test
check is static validation, NOT a language router or a browser/Work test.
"""
from __future__ import annotations
import argparse
import hashlib
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
BRAIN = ROOT / '澜心内容Brain'
BASELINE = '1b307b502b0cc6549861bd835cf96438d686c63d'
REMOTE = 'https://github.com/lanxichen4134-bit/001-.git'
READING = BRAIN / 'Project资料同步包'
SPECS = {
    '01_项目总览与协作方式.md': [('README_内容Brain使用说明.md', None)],
    '06_系统地图与当前项目状态.md': [('Docs/SYSTEM_MAP.md', None), ('Docs/PROJECT_STATE.md', '<project_state>')],
    '07_Project_Instructions_复制版.md': [('Prompts/01_Project_Instructions.md', None)],
    '08_一句话执行与研究协作.md': [
        ('Docs/ONE_SENTENCE_EXECUTION.md', None),
        ('Docs/XIAOHONGSHU_TOPIC_RESEARCH_REFERENCE_V1.0.md', None),
        ('Docs/XIAOHONGSHU_RESEARCH_TEMPLATES_V2.1.md', None),
        ('Docs/RESEARCH_REPORT_STANDARD.md', None),
        ('Content/README_内容共创流程.md', None),
        ('Prompts/09_Work执行入口.md', None),
    ],
}
STATES = {'raw_idea', 'discussing', 'idea_clear', 'structure_ready', 'drafting', 'approved', 'published', 'reviewed'}
CHAIN = 'raw_idea → discussing → idea_clear → structure_ready → drafting → approved → published → reviewed'
LINK = re.compile(r'\[[^\]\n]+\]\(([^\s)]+)\)')


def git(*args):
    return subprocess.check_output(['git', '-c', 'core.quotepath=false', *args], cwd=ROOT)


def body(text):
    return re.sub(r'\A---\n.*?\n---\n\s*', '', text, count=1, flags=re.S).strip()


def selection(path, heading):
    text = path.read_text()
    if heading is None:
        return body(text)
    if heading == '<project_state>':
        fields = [('last_updated', '状态日期'), ('stage', '当前阶段'),
                  ('last_execution', '最近动作'), ('last_remote_verification', '远端验证口径')]
        summary = ['# 当前项目状态', '']
        for key, label in fields:
            value = re.search(r'^' + key + r':\s*(.+)$', text, re.M)
            if value is None:
                raise ValueError(f'missing state field: {key}')
            summary.append(f'- {label}：{value[1]}')
        latest = re.search(r'^# (\d{4}-\d{2}-\d{2}[^\n]*)$', text, re.M)
        if latest is None:
            raise ValueError('missing latest dated project state section')
        summary.extend(['', selection(path, '# ' + latest[1])])
        return '\n'.join(summary)
    marker = heading + '\n'
    if marker not in text:
        raise ValueError(f'missing section: {path.name}: {heading}')
    tail = text.split(marker, 1)[1]
    tail = re.split(r'\n# ', tail, maxsplit=1)[0]
    return marker + tail.strip()


def portable_links(text, source):
    def replace(match):
        target = match.group(1)
        if urlsplit(target).scheme or target.startswith('#'):
            return match.group(0)
        rel, _, anchor = target.partition('#')
        local = (source.parent / unquote(rel)).resolve()
        relative = local.relative_to(ROOT).as_posix()
        url = 'https://github.com/lanxichen4134-bit/001-/blob/main/' + quote(relative)
        if anchor:
            url += '#' + anchor
        return match.group(0).replace(target, url)
    return LINK.sub(replace, text)


def render(name):
    chunks = ['---', 'snapshot_notice: 正式源的生成阅读副本，不在此单独改规则；尚未证明目标Project已上传。',
              'framework_version: 1.0', 'research_module_version: 2.1',
              'source_branch: origin/main', 'source_files:']
    for rel, _ in SPECS[name]:
        path = BRAIN / rel
        chunks.extend([f'  - path: 澜心内容Brain/{rel}', f'    sha256: {hashlib.sha256(path.read_bytes()).hexdigest()}'])
    chunks.extend(['---', '', '<!-- 阅读正文从下一行开始；07仅复制正文到Project Instructions。 -->', ''])
    for rel, heading in SPECS[name]:
        path = BRAIN / rel
        chunks.append(portable_links(selection(path, heading), path))
        chunks.append('')
    return '\n'.join(chunks).rstrip() + '\n'


def missing_links(path, text):
    missing = []
    # Code blocks are examples, not navigable document links.
    text = re.sub(r'(?ms)^(```|~~~).*?^\1[^\n]*$', '', text)
    for target in LINK.findall(text):
        if urlsplit(target).scheme or target.startswith('#'):
            continue
        local = (path.parent / unquote(target.split('#')[0])).resolve()
        if not local.exists():
            missing.append(target)
    return missing


def snapshot_matches(name, actual):
    return actual == render(name)


def private_markers(text):
    patterns = [r'/(?:Users|home)/[^\s]+', r'gh[pousr]_[A-Za-z0-9]{20,}',
                r'github_pat_[A-Za-z0-9_]{20,}', r'sk-[A-Za-z0-9]{20,}',
                r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
                r'(?i)(?:token|password|cookie|secret)\s*[:=]\s*[\"\']?[A-Za-z0-9+/=_-]{16,}',
                r'https?://[^\s]+[?&](?:xsec_token|access_token|auth|signature)=']
    return [pattern for pattern in patterns if re.search(pattern, text)]


def changed_files():
    tracked = git('diff', '--name-only', '-z', BASELINE).decode().split('\0')
    untracked = git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0')
    return sorted({name for name in tracked + untracked if name})


def protected(name):
    if name.startswith('澜心内容Brain/Brain/'):
        return True
    if name.startswith(('Products/', '澜心战略1.0/', '澜心社门店战略1.0/')):
        return True
    if name.startswith(('澜心内容Brain/Content/', '澜心内容Brain/Reviews/', '澜心内容Brain/Inbox/')):
        return not Path(name).name.startswith(('README', '_TEMPLATE'))
    return False


def check():
    failures = []
    def expect(ok, message):
        if not ok:
            failures.append(message)
    expect(git('branch', '--show-current').decode().strip() == 'main', 'branch is not main')
    expect(git('remote', 'get-url', '--all', 'origin').decode().strip() == REMOTE, 'origin fetch URL mismatch')
    expect(git('remote', 'get-url', '--push', '--all', 'origin').decode().strip() == REMOTE, 'origin push URL mismatch')
    for name in SPECS:
        path = READING / name
        expect(path.exists() and snapshot_matches(name, path.read_text()), f'stale/missing snapshot: {name}')
    old_names = git('ls-tree', '-r', '--name-only', '-z', BASELINE).decode().split('\0')
    count = 0
    for name in old_names:
        if name and protected(name):
            count += 1
            path = ROOT / name
            expect(path.exists() and path.read_bytes() == git('show', f'{BASELINE}:{name}'), f'protected asset changed: {name}')
    # This upgrade leaves the old compact personal snapshots byte-for-byte intact.
    # Future Brain changes require human review/regeneration of these four files.
    for prefix in ('02_', '03_', '04_', '05_'):
        files = list(READING.glob(prefix + '*.md'))
        expect(len(files) == 1, f'legacy snapshot missing/duplicated: {prefix}')
        for path in files:
            rel = path.relative_to(ROOT).as_posix()
            expect(path.read_bytes() == git('show', f'{BASELINE}:{rel}'), f'legacy fact snapshot changed: {rel}')
    changed = changed_files()
    for name in changed:
        path = ROOT / name
        expect(not protected(name), f'unexpected write in protected asset scope: {name}')
        expect(path.exists(), f'unexpected deletion: {name}')
        if not path.exists() or path.suffix != '.md':
            continue
        text = path.read_text()
        expect(not missing_links(path, text), f'broken local links: {name}: {missing_links(path, text)}')
        expect(not private_markers(text), f'possible private material: {name}')
    for folder in ('Content', 'Reviews', 'Inbox'):
        for path in (BRAIN / folder).rglob('*.md'):
            if path.name.startswith(('README', '_TEMPLATE')):
                continue
            if '研究资料' in path.relative_to(BRAIN).parts:
                # Bibliography metadata is not Content production status.
                continue
            match = re.search(r'\A---\n(.*?)\n---', path.read_text(), re.S)
            if match:
                status = re.search(r'^status:\s*(\S+)', match[1], re.M)
                if status:
                    expect(status[1] in STATES, f'invalid content status: {path.name}')
    for rel in ('Docs/SYSTEM_MAP.md', 'Prompts/01_Project_Instructions.md'):
        expect(CHAIN in (BRAIN / rel).read_text(), f'content chain missing: {rel}')
    report = (BRAIN / 'Docs/RESEARCH_REPORT_STANDARD.md').read_text()
    for token in ('第一层', '第二层', '第三层', '推翻', '替代解释', '五门槛', '抖音', '小红书', '微信视频号'):
        expect(token in report, f'report contract missing: {token}')
    acceptance = (BRAIN / 'Docs/FRAMEWORK_ACCEPTANCE_2026-10-19.md').read_text()
    for i in range(1, 9):
        expect(f'### 情境{i}｜' in acceptance, f'missing recorded simulation {i}')
    expect('同一会话' in acceptance and '未进行真实平台' in acceptance, 'simulation boundary missing')
    research_acceptance = (BRAIN / 'Docs/XIAOHONGSHU_V2.1_ACCEPTANCE_2026-10-21.md').read_text()
    for i in range(1, 11):
        expect(f'### 情境{i}｜' in research_acceptance, f'missing research simulation {i}')
    template_check = subprocess.run([sys.executable, str(BRAIN / 'Docs/research_template_audit.py'), 'check'],
                                    cwd=ROOT, capture_output=True, text=True)
    expect(template_check.returncode == 0, 'template audit: ' + template_check.stdout + template_check.stderr)
    ignore = (ROOT / '.gitignore').read_text()
    for token in ('.env', 'private/', 'raw/', 'LocalMedia/', 'DataScreenshots/', 'TranscriptionCache/', '*.xlsx', 'ResearchRuns/'):
        expect(token in ignore, f'privacy ignore missing: {token}')
    whitespace = subprocess.run(['git', 'diff', '--check', BASELINE], cwd=ROOT, capture_output=True, text=True)
    expect(whitespace.returncode == 0, 'git diff whitespace check failed: ' + whitespace.stdout)
    if failures:
        for failure in failures:
            print('FAIL:', failure)
        return 1
    print(f'PASS: {len(SPECS)} generated snapshots; {count} protected original assets; 4 unchanged compact fact snapshots; {len(changed)} changed/new files; links, privacy patterns, state chain, report contract, 8 framework/10 research simulation records, public templates and diff checks.')
    print('LIMIT: static checks and recorded same-session simulations; no Work/browser, upload, medical/platform approval or publishing verified. Manual staged review still required.')
    return 0


def self_test():
    assert private_markers('/' + 'Users/example/private.txt')
    assert private_markers('ghp_' + 'a' * 30)
    assert not private_markers('不保存Token或个人资料。')
    assert missing_links(ROOT / 'AGENTS.md', '[bad](missing-framework-test-file.md)')
    assert not missing_links(ROOT / 'AGENTS.md', '[ok](AGENTS.md)')
    state = selection(BRAIN / 'Docs/PROJECT_STATE.md', '<project_state>')
    assert '当前阶段' in state and '最近动作' in state and '# 2026-10-21小红书专项升级' in state
    for name in SPECS:
        expected = render(name)
        assert snapshot_matches(name, expected)
        assert not snapshot_matches(name, expected + '\nmanual drift\n')
        assert 'sha256:' in expected
    assert protected('澜心内容Brain/Brain/03_表达偏好_voice_style.md')
    assert not protected('澜心内容Brain/Content/README_内容共创流程.md')
    print('PASS: checker positive/negative cases for private paths, token-like strings, links, snapshot drift and protected paths. No repository mutations.')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('sync', 'check', 'self-test'))
    command = parser.parse_args().command
    if command == 'sync':
        for name in SPECS:
            (READING / name).write_text(render(name))
        print('Generated 4 reading files locally. No upload or external settings changed.')
        sys.exit(0)
    sys.exit(check() if command == 'check' else self_test())

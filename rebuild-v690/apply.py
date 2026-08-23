from pathlib import Path
import base64, tarfile, shutil

root = Path('.')
parts = sorted((root / 'rebuild-v690').glob('part_[0-9][0-9][0-9]'))
if len(parts) != 7:
    raise SystemExit(f'expected 7 payload parts, found {len(parts)}')

payload = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
archive = root / '.v690-clean-source.tar.gz'
archive.write_bytes(base64.b64decode(payload, validate=True))

with tarfile.open(archive, 'r:gz') as tf:
    members = tf.getmembers()
    for m in members:
        target = (root / m.name).resolve()
        if root.resolve() not in target.parents and target != root.resolve():
            raise SystemExit(f'unsafe archive path: {m.name}')
    tf.extractall(root)
archive.unlink(missing_ok=True)

obsolete_files = [
    'materialize_v681.py','materialize_v682.py','materialize_v683.py','materialize_v684.py',
    'prepare_v61.py','generate_icons.py','sw.js','ASSET_SOURCES.md',
    '.github/workflows/materialize-v681.yml','.github/workflows/materialize-v682.yml',
    '.github/workflows/materialize-v683.yml','.github/workflows/materialize-v684.yml',
]
for rel in obsolete_files:
    (root / rel).unlink(missing_ok=True)

for rel in ['deploy']:
    p = root / rel
    if p.exists():
        shutil.rmtree(p)

print('v6.9.0 clean canonical source applied')

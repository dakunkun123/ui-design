from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / '.tools/python'))
from fontTools import subset

root = Path(__file__).resolve().parent.parent
text = ''.join(path.read_text(encoding='utf-8') for path in (root / 'src').glob('*') if path.suffix in {'.jsx', '.css'})
text += ''.join(chr(code) for code in range(32, 127))
for source, destination in [('NotoSerifSC.ttf', 'ink-song.woff2'), ('MaShanZheng-Regular.ttf', 'ink-brush.woff2')]:
    options = subset.Options()
    options.flavor = 'woff2'
    font = subset.load_font(str(root / 'art-reference/fonts' / source), options)
    worker = subset.Subsetter(options=options)
    worker.populate(text=text)
    worker.subset(font)
    target = root / 'public/fonts' / destination
    subset.save_font(font, str(target), options)
    print(destination, target.stat().st_size)

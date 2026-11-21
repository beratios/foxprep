#!/usr/bin/env python3
"""Check a translation file against src/i18n/source.en.json: same keys, same {placeholders}, nothing left empty."""
import json, re, sys
src = json.load(open("src/i18n/source.en.json"))
ph = lambda s: sorted(re.findall(r"\{(\w+)\}", s))
bad = 0
for code in sys.argv[1:]:
    try:
        tr = json.load(open(f"src/i18n/messages/{code}.json"))
    except Exception as e:
        print(f"{code}: INVALID JSON: {e}"); bad += 1; continue
    missing = [k for k in src if k not in tr]
    extra = [k for k in tr if k not in src]
    phbad = [k for k in src if k in tr and ph(src[k]) != ph(tr[k])]
    empty = [k for k in tr if not str(tr[k]).strip()]
    same = [k for k in src if k in tr and tr[k] == src[k] and re.search(r"[a-z]{4,} [a-z]{3,}", src[k])]
    ok = not (missing or extra or phbad or empty)
    bad += 0 if ok else 1
    print(f"{code}: {'OK' if ok else 'FAIL'} keys={len(tr)}/{len(src)} missing={len(missing)} extra={len(extra)} placeholders={len(phbad)} empty={len(empty)} untranslated_sentences={len(same)}")
    for k in (missing + extra + phbad + empty)[:15]:
        print("   ", k)
    for k in same[:10]:
        print("    untranslated?", k)
sys.exit(1 if bad else 0)

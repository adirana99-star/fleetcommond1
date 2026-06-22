from pathlib import Path
pairs={'{':'}','(':')','[':']'}
openers=set(pairs.keys())
closers=set(pairs.values())
text=Path('App.tsx').read_text(encoding='utf-8')
stack=[]
line=1
in_s=None
escape=False
in_comment=None
for i,ch in enumerate(text):
    if ch=='\n':
        line+=1
        escape=False
        if in_comment=='line': in_comment=None
        continue
    if in_comment=='block':
        if ch=='*' and i+1<len(text) and text[i+1]=='/':
            in_comment=None
            # skip next
            continue
        continue
    if in_comment=='line':
        continue
    if escape:
        escape=False
        continue
    if in_s:
        if ch=='\\':
            escape=True
        elif ch==in_s:
            in_s=None
        continue
    if ch=='/' and i+1<len(text):
        if text[i+1]=='/':
            in_comment='line'
            continue
        if text[i+1]=='*':
            in_comment='block'
            continue
    if ch in ('"', "'", '`'):
        in_s=ch
        continue
    if ch in openers:
        stack.append((ch,line))
    elif ch in closers:
        if not stack:
            print('Unmatched closing', ch, 'at line', line)
            break
        o,l=stack.pop()
        if pairs[o]!=ch:
            print('Mismatch', o, 'at line', l, 'expected', pairs[o], 'got', ch, 'at line', line)
            break
else:
    if stack:
        print('Unmatched openings:')
        for o,l in stack[-10:]:
            print(o,l)
    else:
        print('Balanced')

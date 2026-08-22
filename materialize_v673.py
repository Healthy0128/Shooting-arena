from pathlib import Path

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

# v6.7.3 Horizontal Battle Axis
# P1 = left, P2 = right. Keep portrait touch UI unchanged.
old="root.position.set(0,0,i?-4.5:4.5);scene.add(root);const p={i,key,cfg,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(0,i?1:-1),r:.58,mix:null}"
new="root.position.set(i?4.5:-4.5,0,0);scene.add(root);const p={i,key,cfg,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:.58,mix:null}"
if old not in js: raise SystemExit('player spawn hook not found')
js=js.replace(old,new,1)

old="p.root.position.set(0,0,i?-4.5:4.5)"
new="p.root.position.set(i?4.5:-4.5,0,0)"
if old not in js: raise SystemExit('reset spawn hook not found')
js=js.replace(old,new,1)

# Rotate spawn rings and lane accents from vertical battle axis to horizontal.
js=js.replace("paint(0,-5.5,17,.16,th.accent,.45);paint(0,5.5,17,.16,th.accent,.45);", "paint(-8.4,0,.16,11.2,th.accent,.35);paint(8.4,0,.16,11.2,th.accent,.35);",1)
js=js.replace("glowRing(0,-4.5,1.15,th.glow,.5);glowRing(0,4.5,1.15,th.glow,.5);", "glowRing(-4.5,0,1.15,0x74d5ff,.5);glowRing(4.5,0,1.15,0xff7b92,.5);",1)

# Tune shared 3D camera for a left-right duel: lower and slightly farther back.
js=js.replace("const height=THREE.MathUtils.clamp(11.8+dist*.43,12.5,18.2);\n  const back=THREE.MathUtils.clamp(8.8+dist*.32,9.5,14.2);", "const height=THREE.MathUtils.clamp(10.8+dist*.34,11.6,16.6);\n  const back=THREE.MathUtils.clamp(9.8+dist*.24,10.2,13.8);",1)

# Version labels.
html=html.replace('Duel Arena v6.7.2','Duel Arena v6.7.3')
html=html.replace('<strong>v6.7.2</strong><span>EXPERIMENTAL 3D CAMERA</span>','<strong>v6.7.3</strong><span>HORIZONTAL BATTLE AXIS</span>')
html=html.replace('3D ARENA: 2人の中点を追従＋距離で自動ズーム','3D ARENA: 左右対戦＋中点追従＋距離で自動ズーム')

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.3 horizontal battle axis materialized')

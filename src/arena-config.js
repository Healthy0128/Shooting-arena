export const ARENA={halfW:16.5,halfH:10.5};
export const SPAWN_X=12.0;

const PROP_BASE = './assets/models/stage/';
export const PROPS={
  wall:PROP_BASE+'Wall.gltf', wallDecorated:PROP_BASE+'Wall_Decorated.gltf',
  pillarA:PROP_BASE+'Pillar_A.gltf', pillarB:PROP_BASE+'Pillar_B.gltf',
  ammo:PROP_BASE+'Ammo_Box.gltf', boxA:PROP_BASE+'Box_A.gltf', boxB:PROP_BASE+'Box_B.gltf', boxC:PROP_BASE+'Box_C.gltf',
  barrelA:PROP_BASE+'Barrel_A.gltf', barrelB:PROP_BASE+'Barrel_B.gltf', barrelC:PROP_BASE+'Barrel_C.gltf',
  floor:PROP_BASE+'Floor.gltf', floorDirt:PROP_BASE+'Floor_Dirt.gltf',
  locker:PROP_BASE+'Locker.gltf', workbench:PROP_BASE+'Workbench.gltf', pallet:PROP_BASE+'Pallet_Large.gltf'
};

export const STAGE_THEMES={
  square:{bg:0x0d1520,fog:0x0d1520,floor:0x34445b,edge:0x1a2535,accent:0x59b8ff,accentSoft:0xa7dcff,rim:0x55708d,glow:0x7fd7ff,floorProp:PROPS.floor},
  pillars:{bg:0x15161f,fog:0x15161f,floor:0x4a4549,edge:0x2a262b,accent:0xe5ba68,accentSoft:0xf8deb2,rim:0x75685f,glow:0xffd27a,floorProp:PROPS.floor},
  ring:{bg:0x191117,fog:0x191117,floor:0x433542,edge:0x251a25,accent:0xff6f96,accentSoft:0xffc1d5,rim:0x7d5067,glow:0xff97b6,floorProp:PROPS.floor},
  cross:{bg:0x101922,fog:0x101922,floor:0x31404d,edge:0x18222b,accent:0x4fd6d6,accentSoft:0xc6ffff,rim:0x608e95,glow:0x8affff,floorProp:PROPS.floor},
  hex:{bg:0x120f1f,fog:0x120f1f,floor:0x2f2948,edge:0x1b1630,accent:0x9f74ff,accentSoft:0xd8c3ff,rim:0x6f62ad,glow:0xbc97ff,floorProp:PROPS.floor},
  fort:{bg:0x181613,fog:0x181613,floor:0x5a4e44,edge:0x312820,accent:0xd6b789,accentSoft:0xf4e1c3,rim:0x8b7152,glow:0xffd9a0,floorProp:PROPS.floorDirt},
  bush:{bg:0x0e1812,fog:0x0e1812,floor:0x39523d,edge:0x223126,accent:0x72d98c,accentSoft:0xd6ffe1,rim:0x568061,glow:0x9effb0,floorProp:PROPS.floorDirt},
  crates:{bg:0x171412,fog:0x171412,floor:0x4d443d,edge:0x28231f,accent:0xffa85e,accentSoft:0xffddbc,rim:0x866c55,glow:0xffc178,floorProp:PROPS.floor}
};

export const ARENA_OPTIONS={
  square:'スクエア',
  pillars:'4ピラー',
  ring:'リング',
  cross:'クロス',
  hex:'ヘックス',
  fort:'ツインフォート',
  bush:'ブッシュフィールド',
  crates:'クレートヤード'
};

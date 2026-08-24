const GLB_BASE_ADV = './assets/models/characters/';
const WEAPON_BASE = './assets/models/weapons/';

export const CHARACTERS = {
  ranger:{recovery:.10,defense:'roll',weaponStyle:'rifle',bulletRadius:.12,bulletLife:1.85,recoil:.10,name:'RANGER', hp:102, speed:4.8, fireCd:.28, damage:19, bulletSpeed:15.2, spread:.008, color:0x35a7ff, super:'rapid', model:GLB_BASE_ADV+'Knight.glb', weaponModel:WEAPON_BASE+'sword_A.gltf', weaponScale:.85},
  crusher:{recovery:.42,defense:'guard',weaponStyle:'scatter',bulletRadius:.10,bulletLife:.72,recoil:.30,name:'CRUSHER', hp:138, speed:4.0, fireCd:.78, damage:11, pellets:7, bulletSpeed:10.5, spread:.34, color:0xff8a3d, super:'blast', model:GLB_BASE_ADV+'Barbarian.glb', weaponModel:WEAPON_BASE+'axe_A.gltf', weaponScale:.9},
  dash:{recovery:.025,defense:'step',weaponStyle:'rapid',bulletRadius:.12,bulletLife:1.35,recoil:.035,name:'DASH', hp:82, speed:6.2, fireCd:.095, damage:7, bulletSpeed:16.2, spread:.045, color:0x9c6cff, super:'dash', model:GLB_BASE_ADV+'Rogue_Hooded.glb', weaponModel:WEAPON_BASE+'dagger_A.gltf', weaponScale:.9},
  mage:{recovery:.18,defense:'barrier',weaponStyle:'arcane',bulletRadius:.29,bulletLife:2.6,recoil:.07,name:'MAGE', hp:88, speed:4.6, fireCd:.42, damage:14, bulletSpeed:9.5, spread:.015, color:0x5be0d0, super:'nova', model:GLB_BASE_ADV+'Mage.glb', weaponModel:WEAPON_BASE+'staff_A.gltf', weaponScale:.78},
  rogue:{recovery:.12,defense:'evade',weaponStyle:'bladegun',bulletRadius:.11,bulletLife:3.25,recoil:.08,name:'ROGUE', hp:92, speed:5.7, fireCd:.34, damage:18, bulletSpeed:13.5, spread:.008, color:0xffd45a, super:'fan', model:GLB_BASE_ADV+'Rogue.glb', weaponModel:WEAPON_BASE+'sword_B.gltf', weaponScale:.8},
  skeleton:{recovery:.55,defense:'parry',weaponStyle:'cannon',bulletRadius:.18,bulletLife:1.85,recoil:.42,name:'BONES', hp:114, speed:4.35, fireCd:1.0, damage:58, bulletSpeed:8.2, spread:.012, color:0xded6c1, super:'boneStorm', model:GLB_BASE_ADV+'Skeleton_Warrior.glb', weaponModel:WEAPON_BASE+'axe_B.gltf', weaponScale:.9}
};

export const BODY_META={
  knight:{source:'ranger',label:'BALANCED',role:'万能型',desc:'攻守・速度・SUPERがすべて標準',weight:'medium',hpMul:1.00,speedMul:1.00,damageMul:1.00,damageTakenMul:1.00,superGainMul:1.00,radius:.58,knockbackResist:.12,recoilResist:.10,dashMul:1.00},
  barbarian:{source:'crusher',label:'HEAVY',role:'重装火力型',desc:'硬くて高火力。ただし遅くSUPERも溜まりにくい',weight:'heavy',hpMul:1.18,speedMul:.84,damageMul:1.10,damageTakenMul:.82,superGainMul:.78,radius:.68,knockbackResist:.38,recoilResist:.32,dashMul:.80},
  rogueHood:{source:'dash',label:'LIGHT',role:'超高速型',desc:'最速だが低火力・低耐久。SUPERはやや溜まりやすい',weight:'light',hpMul:.80,speedMul:1.22,damageMul:.88,damageTakenMul:1.18,superGainMul:1.15,radius:.50,knockbackResist:-.12,recoilResist:-.08,dashMul:1.20},
  mage:{source:'mage',label:'TECH',role:'SUPER特化',desc:'SUPER獲得が非常に速い代わりに火力と耐久が低い',weight:'medium',hpMul:.86,speedMul:1.00,damageMul:.82,damageTakenMul:1.16,superGainMul:1.55,radius:.55,knockbackResist:.00,recoilResist:.05,dashMul:1.00},
  rogue:{source:'rogue',label:'AGILE',role:'攻撃機動型',desc:'速く高火力だが打たれ弱い',weight:'light',hpMul:.90,speedMul:1.16,damageMul:1.08,damageTakenMul:1.08,superGainMul:1.05,radius:.52,knockbackResist:-.08,recoilResist:-.03,dashMul:1.12},
  skeleton:{source:'skeleton',label:'ARMORED',role:'一撃重量型',desc:'高火力・高耐久だが鈍重でSUPERが溜まりにくい',weight:'heavy',hpMul:1.14,speedMul:.88,damageMul:1.22,damageTakenMul:.90,superGainMul:.75,radius:.63,knockbackResist:.28,recoilResist:.22,dashMul:.88}
};
export const BODY_SOURCE=Object.fromEntries(
  Object.entries(BODY_META).map(([key,body])=>[key,body.source])
);

export const WEAPON_SOURCE=Object.fromEntries(
  Object.entries(CHARACTERS).map(([key,character])=>[character.weaponStyle,key])
);

export const WEAPON_INFO={
  rifle:{name:'RIFLE',role:'万能・高精度',desc:'正確で扱いやすい標準武器。連射と火力は中程度'},
  scatter:{name:'SCATTER',role:'超近距離バースト',desc:'7発散弾。密着なら77基礎ダメージ、1発だけなら11。射程は非常に短い'},
  rapid:{name:'RAPID',role:'高速削り',desc:'超連射・高速弾で当てやすいが1発7ダメージ。HEAT管理が重要'},
  arcane:{name:'ARCANE',role:'大型弾・長射程',desc:'大きな弾で当てやすく長く残る代わりに単発火力は低い'},
  bladegun:{name:'BLADE GUN',role:'リコシェット',desc:'壁反射で強化。直撃×0.8 / 1反射×1.0 / 2反射×1.3 / 3反射×2.0'},
  cannon:{name:'CANNON',role:'高難度・超火力',desc:'遅く小さい弾で当てにくいが、命中時58基礎ダメージ'}
};

export const COLOR_VALUES={
  cyan:CHARACTERS.ranger.color,
  orange:CHARACTERS.crusher.color,
  violet:CHARACTERS.dash.color,
  mint:CHARACTERS.mage.color,
  gold:CHARACTERS.rogue.color,
  bone:CHARACTERS.skeleton.color,
  pink:0xff6fae,
  lime:0xa7ef62
};

// Cost restrictions are temporarily disabled while balance and feel are tuned.
export const BUILD_LIMIT=999;

export const PASSIVES={
  coolant:{name:'COOLANT',cost:1,desc:'HEATの冷却速度 +25%'},
  stabilizer:{name:'STABILIZER',cost:1,desc:'射撃反動 -35%'},
  sprinter:{name:'SPRINTER',cost:1,desc:'移動速度 +6%'},
  armor:{name:'ARMOR PLATE',cost:2,desc:'受けるダメージ -8%'},
  charger:{name:'CHARGER',cost:2,desc:'SUPER獲得量 +18%'},
  coreHunter:{name:'CORE HUNTER',cost:1,desc:'POWER CORE効果時間 +3秒'}
};

export const DEFENSE_INFO={
  roll:{name:'ROLL',desc:'進行方向へ回避。0.26秒無敵 / CT 2.4秒'},
  guard:{name:'GUARD',desc:'前方ダメージを78%軽減。ガードゲージ制'},
  step:{name:'STEP',desc:'素早く前進回避。0.17秒無敵 / CT 1.7秒'},
  barrier:{name:'BARRIER',desc:'55ダメージ分を吸収するバリア / CT 6秒'},
  evade:{name:'EVADE',desc:'長めの回避移動。0.38秒無敵 / CT 3.2秒'},
  parry:{name:'PARRY',desc:'0.18秒受け流し。成功すると弾を反射・強化'}
};

export const SUPER_INFO={
  rapid:{name:'OVERDRIVE',desc:'現在の照準方向へ12連射'},
  blast:{name:'BLAST RING',desc:'周囲360°へ18発を一斉射撃'},
  dash:{name:'PHANTOM DASH',desc:'0.65秒無敵で高速突進'},
  nova:{name:'NOVA',desc:'全周20発＋HPを24回復'},
  fan:{name:'BLADE FAN',desc:'前方へ扇状に11発を一斉射撃'},
  boneStorm:{name:'STORM',desc:'時間差で2回の全周弾幕を発生'}
};

export const LOADOUT_OPTIONS={
  body:{knight:'KNIGHT',barbarian:'BARBARIAN',rogueHood:'HOODED',mage:'MAGE',rogue:'ROGUE',skeleton:'BONES'},
  weapon:{rifle:'RIFLE',scatter:'SCATTER',rapid:'RAPID',arcane:'ARCANE',bladegun:'BLADE GUN',cannon:'CANNON'},
  defense:Object.fromEntries(Object.entries(DEFENSE_INFO).map(([key,info])=>[key,info.name])),
  super:Object.fromEntries(Object.entries(SUPER_INFO).map(([key,info])=>[key,info.name])),
  color:Object.fromEntries(Object.keys(COLOR_VALUES).map(key=>[key,key.toUpperCase()])),
  passive:Object.fromEntries(Object.entries(PASSIVES).map(([key,passive])=>[key,passive.name]))
};

export const DEFAULT_LOADOUTS=[
  {body:'knight',weapon:'rifle',defense:'roll',super:'rapid',color:'cyan',passive:'coolant'},
  {body:'barbarian',weapon:'scatter',defense:'guard',super:'blast',color:'orange',passive:'coolant'}
];

const PASSIVE_COSTS=Object.fromEntries(
  Object.entries(PASSIVES).map(([key,passive])=>[key,passive.cost])
);

export const BUILD_COSTS={
  body:{knight:2,barbarian:3,rogueHood:2,mage:2,rogue:2,skeleton:3},
  weapon:{rifle:2,scatter:3,rapid:3,arcane:3,bladegun:2,cannon:4},
  defense:{roll:2,guard:3,step:2,barrier:3,evade:3,parry:4},
  super:{rapid:2,blast:2,dash:2,nova:3,fan:2,boneStorm:3},
  passive:PASSIVE_COSTS
};

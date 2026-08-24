const GLB_BASE_ADV = './assets/models/characters/';
const WEAPON_BASE = './assets/models/weapons/';

export const CHARACTERS = {
  ranger:{recovery:.08,defense:'roll',weaponStyle:'rifle',bulletRadius:.14,bulletLife:1.75,recoil:.10,name:'RANGER', hp:100, speed:4.8, fireCd:.22, damage:20, bulletSpeed:13, spread:0, color:0x35a7ff, super:'rapid', model:GLB_BASE_ADV+'Knight.glb', weaponModel:WEAPON_BASE+'sword_A.gltf', weaponScale:.85},
  crusher:{recovery:.34,defense:'guard',weaponStyle:'scatter',bulletRadius:.12,bulletLife:1.15,recoil:.22,name:'CRUSHER', hp:135, speed:4.0, fireCd:.62, damage:13, pellets:5, bulletSpeed:11.5, spread:.26, color:0xff8a3d, super:'blast', model:GLB_BASE_ADV+'Barbarian.glb', weaponModel:WEAPON_BASE+'axe_A.gltf', weaponScale:.9},
  dash:{recovery:.035,defense:'step',weaponStyle:'rapid',bulletRadius:.10,bulletLife:1.45,recoil:.06,name:'DASH', hp:82, speed:6.2, fireCd:.17, damage:13, bulletSpeed:14.5, spread:.03, color:0x9c6cff, super:'dash', model:GLB_BASE_ADV+'Rogue_Hooded.glb', weaponModel:WEAPON_BASE+'dagger_A.gltf', weaponScale:.9},
  mage:{recovery:.18,defense:'barrier',weaponStyle:'arcane',bulletRadius:.20,bulletLife:2.0,recoil:.08,name:'MAGE', hp:88, speed:4.6, fireCd:.34, damage:24, bulletSpeed:10.5, spread:.02, color:0x5be0d0, super:'nova', model:GLB_BASE_ADV+'Mage.glb', weaponModel:WEAPON_BASE+'staff_A.gltf', weaponScale:.78},
  rogue:{recovery:.07,defense:'evade',weaponStyle:'bladegun',bulletRadius:.13,bulletLife:1.55,recoil:.09,name:'ROGUE', hp:92, speed:5.7, fireCd:.19, damage:15, bulletSpeed:14, spread:.06, color:0xffd45a, super:'fan', model:GLB_BASE_ADV+'Rogue.glb', weaponModel:WEAPON_BASE+'sword_B.gltf', weaponScale:.8},
  skeleton:{recovery:.42,defense:'parry',weaponStyle:'cannon',bulletRadius:.24,bulletLife:1.70,recoil:.28,name:'BONES', hp:112, speed:4.35, fireCd:.42, damage:28, bulletSpeed:11.8, spread:.01, color:0xded6c1, super:'boneStorm', model:GLB_BASE_ADV+'Skeleton_Warrior.glb', weaponModel:WEAPON_BASE+'axe_B.gltf', weaponScale:.9}
};

export const BODY_META={
  knight:{source:'ranger',label:'BALANCED',weight:'medium',hpMul:1.00,speedMul:1.00,radius:.58,knockbackResist:.12,recoilResist:.10,dashMul:1.00},
  barbarian:{source:'crusher',label:'HEAVY',weight:'heavy',hpMul:1.16,speedMul:.88,radius:.66,knockbackResist:.34,recoilResist:.28,dashMul:.84},
  rogueHood:{source:'dash',label:'LIGHT',weight:'light',hpMul:.88,speedMul:1.16,radius:.52,knockbackResist:-.10,recoilResist:-.06,dashMul:1.16},
  mage:{source:'mage',label:'TECH',weight:'medium',hpMul:.94,speedMul:.98,radius:.56,knockbackResist:.04,recoilResist:.06,dashMul:1.00},
  rogue:{source:'rogue',label:'AGILE',weight:'light',hpMul:.92,speedMul:1.10,radius:.53,knockbackResist:-.06,recoilResist:-.02,dashMul:1.10},
  skeleton:{source:'skeleton',label:'ARMORED',weight:'heavy',hpMul:1.10,speedMul:.92,radius:.62,knockbackResist:.24,recoilResist:.18,dashMul:.90}
};
export const BODY_SOURCE=Object.fromEntries(
  Object.entries(BODY_META).map(([key,body])=>[key,body.source])
);

export const WEAPON_SOURCE=Object.fromEntries(
  Object.entries(CHARACTERS).map(([key,character])=>[character.weaponStyle,key])
);
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
export const BUILD_LIMIT=10;

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

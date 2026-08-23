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

export const BODY_SOURCE={knight:'ranger',barbarian:'crusher',rogueHood:'dash',mage:'mage',rogue:'rogue',skeleton:'skeleton'};
export const BODY_META={
  knight:{label:'BALANCED',weight:'medium',hpMul:1.00,speedMul:1.00,radius:.58,knockbackResist:.12,recoilResist:.10,dashMul:1.00},
  barbarian:{label:'HEAVY',weight:'heavy',hpMul:1.16,speedMul:.88,radius:.66,knockbackResist:.34,recoilResist:.28,dashMul:.84},
  rogueHood:{label:'LIGHT',weight:'light',hpMul:.88,speedMul:1.16,radius:.52,knockbackResist:-.10,recoilResist:-.06,dashMul:1.16},
  mage:{label:'TECH',weight:'medium',hpMul:.94,speedMul:.98,radius:.56,knockbackResist:.04,recoilResist:.06,dashMul:1.00},
  rogue:{label:'AGILE',weight:'light',hpMul:.92,speedMul:1.10,radius:.53,knockbackResist:-.06,recoilResist:-.02,dashMul:1.10},
  skeleton:{label:'ARMORED',weight:'heavy',hpMul:1.10,speedMul:.92,radius:.62,knockbackResist:.24,recoilResist:.18,dashMul:.90}
};

export const WEAPON_SOURCE=Object.fromEntries(
  Object.entries(CHARACTERS).map(([key,character])=>[character.weaponStyle,key])
);
export const COLOR_VALUES={cyan:0x35a7ff,orange:0xff8a3d,violet:0x9c6cff,mint:0x5be0d0,gold:0xffd45a,bone:0xded6c1,pink:0xff6fae,lime:0xa7ef62};
export const BUILD_LIMIT=10;

export const PASSIVES={
  coolant:{
    name:'COOLANT',
    cost:1,
    desc:'HEAT cooling +25%'
  },
  stabilizer:{
    name:'STABILIZER',
    cost:1,
    desc:'Weapon recoil -35%'
  },
  sprinter:{
    name:'SPRINTER',
    cost:1,
    desc:'Move speed +6%'
  },
  armor:{
    name:'ARMOR PLATE',
    cost:2,
    desc:'Damage taken -8%'
  },
  charger:{
    name:'CHARGER',
    cost:2,
    desc:'SUPER gain +18%'
  },
  coreHunter:{
    name:'CORE HUNTER',
    cost:1,
    desc:'POWER duration +3s'
  }
};

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

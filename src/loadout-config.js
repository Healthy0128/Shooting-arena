const GLB_BASE_ADV = './assets/models/characters/';
const WEAPON_BASE = './assets/models/weapons/';

export const CHARACTERS = {
  ranger:{recovery:.10,defense:'roll',weaponStyle:'rifle',bulletRadius:.12,bulletLife:1.85,recoil:.10,name:'レンジャー', hp:102, speed:4.8, fireCd:.28, damage:19, bulletSpeed:15.2, spread:.008, color:0x35a7ff, super:'rapid', model:GLB_BASE_ADV+'Knight.glb', weaponModel:WEAPON_BASE+'sword_A.gltf', weaponScale:.85},
  crusher:{recovery:.42,defense:'guard',weaponStyle:'scatter',bulletRadius:.10,bulletLife:.72,recoil:.30,name:'クラッシャー', hp:138, speed:4.0, fireCd:.78, damage:11, pellets:7, bulletSpeed:10.5, spread:.34, color:0xff8a3d, super:'blast', model:GLB_BASE_ADV+'Barbarian.glb', weaponModel:WEAPON_BASE+'axe_A.gltf', weaponScale:.9},
  dash:{recovery:.025,defense:'step',weaponStyle:'rapid',bulletRadius:.12,bulletLife:1.35,recoil:.035,name:'ダッシュ', hp:82, speed:6.2, fireCd:.095, damage:7, bulletSpeed:16.2, spread:.045, color:0x9c6cff, super:'dash', model:GLB_BASE_ADV+'Rogue_Hooded.glb', weaponModel:WEAPON_BASE+'dagger_A.gltf', weaponScale:.9},
  mage:{recovery:.18,defense:'barrier',weaponStyle:'arcane',bulletRadius:.29,bulletLife:2.6,recoil:.07,name:'メイジ', hp:88, speed:4.6, fireCd:.42, damage:14, bulletSpeed:9.5, spread:.015, color:0x5be0d0, super:'nova', model:GLB_BASE_ADV+'Mage.glb', weaponModel:WEAPON_BASE+'staff_A.gltf', weaponScale:.78},
  rogue:{recovery:.12,defense:'evade',weaponStyle:'bladegun',bulletRadius:.11,bulletLife:3.25,recoil:.08,name:'ローグ', hp:92, speed:5.7, fireCd:.34, damage:18, bulletSpeed:13.5, spread:.008, color:0xffd45a, super:'fan', model:GLB_BASE_ADV+'Rogue.glb', weaponModel:WEAPON_BASE+'sword_B.gltf', weaponScale:.8},
  skeleton:{recovery:.55,defense:'parry',weaponStyle:'cannon',bulletRadius:.18,bulletLife:1.85,recoil:.42,name:'ボーンズ', hp:114, speed:4.35, fireCd:1.0, damage:58, bulletSpeed:8.2, spread:.012, color:0xded6c1, super:'boneStorm', model:GLB_BASE_ADV+'Skeleton_Warrior.glb', weaponModel:WEAPON_BASE+'axe_B.gltf', weaponScale:.9}
};

export const BODY_META={
  knight:{source:'ranger',label:'バランス',role:'万能型',desc:'攻守・速度・必殺ゲージがすべて標準',longDesc:'クセが少なく、どの武器とも合わせやすい標準型。攻撃・防御・移動速度・必殺ゲージ獲得量に補正がなく、まず操作を覚えたいときに向いています。',weight:'medium',hpMul:1.00,speedMul:1.00,damageMul:1.00,damageTakenMul:1.00,superGainMul:1.00,radius:.58,knockbackResist:.12,recoilResist:.10,dashMul:1.00},
  barbarian:{source:'crusher',label:'重装',role:'重装火力型',desc:'硬くて高火力。ただし遅く必殺も溜まりにくい',longDesc:'攻撃力と耐久力を高めた重量型。攻撃110%、被ダメージ82%。その代わり移動が遅く、必殺ゲージ獲得量は78%です。正面から押し切りたい人向け。',weight:'heavy',hpMul:1.18,speedMul:.84,damageMul:1.10,damageTakenMul:.82,superGainMul:.78,radius:.68,knockbackResist:.38,recoilResist:.32,dashMul:.80},
  rogueHood:{source:'dash',label:'軽量',role:'超高速型',desc:'最速だが低火力・低耐久。必殺はやや溜まりやすい',longDesc:'移動速度を最優先した軽量型。攻撃88%、被ダメージ118%とかなり脆い代わりに、圧倒的な機動力で相手の射線を外しやすく、必殺ゲージも115%で溜まります。',weight:'light',hpMul:.80,speedMul:1.22,damageMul:.88,damageTakenMul:1.18,superGainMul:1.15,radius:.50,knockbackResist:-.12,recoilResist:-.08,dashMul:1.20},
  mage:{source:'mage',label:'テック',role:'必殺特化',desc:'必殺が非常に速い代わりに火力と耐久が低い',longDesc:'通常戦闘力を落として必殺技の回転率に特化した型。攻撃82%、被ダメージ116%ですが、必殺ゲージ獲得量は155%。必殺技を軸に戦う構成向け。',weight:'medium',hpMul:.86,speedMul:1.00,damageMul:.82,damageTakenMul:1.16,superGainMul:1.55,radius:.55,knockbackResist:.00,recoilResist:.05,dashMul:1.00},
  rogue:{source:'rogue',label:'機動',role:'攻撃機動型',desc:'速く高火力だが打たれ弱い',longDesc:'速度と攻撃力を両立した攻め型。攻撃108%、速度も高い一方で被ダメージ108%。ヒット＆アウェイや反射武器との相性が良いです。',weight:'light',hpMul:.90,speedMul:1.16,damageMul:1.08,damageTakenMul:1.08,superGainMul:1.05,radius:.52,knockbackResist:-.08,recoilResist:-.03,dashMul:1.12},
  skeleton:{source:'skeleton',label:'装甲',role:'一撃重量型',desc:'高火力・高耐久だが鈍重で必殺が溜まりにくい',longDesc:'一撃の重さと耐久力に振った重量型。攻撃122%、被ダメージ90%と強力ですが、移動は遅く、必殺ゲージ獲得量は75%。大砲などの高威力武器向け。',weight:'heavy',hpMul:1.14,speedMul:.88,damageMul:1.22,damageTakenMul:.90,superGainMul:.75,radius:.63,knockbackResist:.28,recoilResist:.22,dashMul:.88}
};
export const BODY_SOURCE=Object.fromEntries(
  Object.entries(BODY_META).map(([key,body])=>[key,body.source])
);

export const WEAPON_SOURCE=Object.fromEntries(
  Object.entries(CHARACTERS).map(([key,character])=>[character.weaponStyle,key])
);

export const WEAPON_INFO={
  rifle:{name:'ライフル',role:'万能・高精度',desc:'正確で扱いやすい標準武器',longDesc:'弾速が速く、ほぼブレず、射程も十分。1発19ダメージ、約3.6発/秒。極端な強みはありませんが、どの距離でも安定して戦えます。'},
  scatter:{name:'ショットガン',role:'超近距離バースト',desc:'7発散弾。密着すると大ダメージ',longDesc:'1発11ダメージの散弾を7発同時発射。密着なら基礎77ダメージですが、離れるほど当たる弾数が減り、1発だけなら11ダメージ。射程も非常に短い近距離専用武器です。'},
  rapid:{name:'ラピッド',role:'高速削り',desc:'超連射で当てやすいが1発は弱い',longDesc:'約10.5発/秒の超連射と高速弾が特徴。1発7ダメージなので単発は弱く、追い続けて削る武器です。撃ち続けるとオーバーヒートするため、指切りも重要です。'},
  arcane:{name:'アーケイン',role:'大型弾・長射程',desc:'大きい弾で当てやすいが単発火力は低め',longDesc:'弾が大きく長時間残るため、相手の進路を塞ぎやすい武器。1発14ダメージと低めですが、命中させやすく、遠距離や牽制で強みが出ます。'},
  bladegun:{name:'ブレードガン',role:'リコシェット',desc:'壁反射を重ねるほど威力アップ',longDesc:'直接当てると0.8倍、1回反射で1.0倍、2回反射で1.3倍、3回反射で2.0倍。最大3回まで壁や障害物で跳ね返ります。狙いにくい角度ほど高火力になります。'},
  cannon:{name:'キャノン',role:'高難度・超火力',desc:'遅く当てにくいが一撃が非常に重い',longDesc:'1秒に1発、弾速も遅く、弾も小さめで命中させにくい代わりに基礎58ダメージ。読みと置き撃ちが必要な上級者向け高威力武器です。'}
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

export const BUILD_LIMIT=999;

export const PASSIVES={
  coolant:{name:'クーラント',cost:1,desc:'オーバーヒート冷却 +25%',longDesc:'射撃で溜まったヒートの冷却速度が25%上がります。ラピッドなど、連射してヒートが溜まりやすい武器と好相性です。'},
  stabilizer:{name:'スタビライザー',cost:1,desc:'射撃反動 -35%',longDesc:'射撃時にキャラクターが後ろへ押される反動を35%軽減します。キャノンやショットガンなど反動の大きい武器で位置を保ちやすくなります。'},
  sprinter:{name:'スプリンター',cost:1,desc:'移動速度 +6%',longDesc:'常時移動速度が6%上昇します。回避や間合い管理を重視する構成向けです。'},
  armor:{name:'アーマープレート',cost:2,desc:'受けるダメージ -8%',longDesc:'すべての受けるダメージを8%軽減します。BODY側の耐久補正と重なるため、重装型ではさらに粘り強くなります。'},
  charger:{name:'チャージャー',cost:2,desc:'必殺ゲージ獲得 +18%',longDesc:'与えたダメージ・受けたダメージから得る必殺ゲージ量が18%増えます。必殺特化BODYと組み合わせると高回転になります。'},
  coreHunter:{name:'コアハンター',cost:1,desc:'パワーコア効果 +3秒',longDesc:'中央に出現するパワーコアを取ったときの強化時間が8秒から11秒になります。コア争奪を重視する構成向けです。'}
};

export const DEFENSE_INFO={
  roll:{name:'ロール',desc:'進行方向へ回避。0.26秒無敵',longDesc:'入力している移動方向へ素早く転がります。0.26秒の無敵時間があり、クールタイムは2.4秒。弾を見てから避ける基本的な防御です。'},
  guard:{name:'ガード',desc:'前方ダメージを78%軽減',longDesc:'前方から受けるダメージを78%軽減します。ガードゲージを消費し、削り切られるとガードブレイク。移動速度も落ちるため、向きと解除タイミングが重要です。'},
  step:{name:'ステップ',desc:'短CTの高速回避。0.17秒無敵',longDesc:'短い無敵時間と長めの移動距離を持つ高速回避。無敵0.17秒、クールタイム1.7秒。連続して位置を変えたい高速型向けです。'},
  barrier:{name:'バリア',desc:'55ダメージ分を吸収',longDesc:'55ダメージ分まで攻撃を肩代わりするバリアを展開します。クールタイム6秒。大技を受ける前に先置きすると強力です。'},
  evade:{name:'イベイド',desc:'長距離回避。0.38秒無敵',longDesc:'横方向にも逃げやすい長距離回避。0.38秒の長い無敵時間がありますが、クールタイムは3.2秒。危険な場面を一気に抜ける防御です。'},
  parry:{name:'パリィ',desc:'0.18秒受け流し。弾を反射',longDesc:'0.18秒の短い受付時間中に正面から弾を受けると、その弾を相手へ反射し威力と速度を強化します。成功時はすぐ次のパリィも狙えます。'}
};

export const SUPER_INFO={
  rapid:{name:'オーバードライブ',desc:'照準方向へ12連射',longDesc:'現在向いている方向へ高速で12発を連射します。瞬間的に弾幕を作れるため、相手の回避後や近距離で強力です。'},
  blast:{name:'ブラストリング',desc:'周囲360°へ18発',longDesc:'自分を中心に18発の散弾を全方向へ同時発射します。囲まれた状況や近距離での切り返しに向いています。'},
  dash:{name:'ファントムダッシュ',desc:'0.65秒無敵で高速突進',longDesc:'向いている方向へ高速突進し、0.65秒間無敵になります。攻撃というより位置取りと緊急離脱に特化した必殺技です。'},
  nova:{name:'ノヴァ',desc:'全周20発＋HP24回復',longDesc:'全方向へ20発の魔法弾を放ちながらHPを24回復します。攻撃と立て直しを同時にできる万能な必殺技です。'},
  fan:{name:'ブレードファン',desc:'前方へ扇状に11発',longDesc:'正面広範囲へ11発を扇状に一斉発射します。中距離で相手の回避先までまとめて狙いやすい必殺技です。'},
  boneStorm:{name:'ボーンストーム',desc:'時間差で2回の全周弾幕',longDesc:'時間差で2回、16発ずつの全周弾幕を発生させます。1波目を避けた相手へ2波目を重ねて圧力をかけます。'}
};

export const LOADOUT_OPTIONS={
  body:{knight:'ナイト',barbarian:'バーバリアン',rogueHood:'フーデッド',mage:'メイジ',rogue:'ローグ',skeleton:'ボーンズ'},
  weapon:Object.fromEntries(Object.entries(WEAPON_INFO).map(([key,info])=>[key,info.name])),
  defense:Object.fromEntries(Object.entries(DEFENSE_INFO).map(([key,info])=>[key,info.name])),
  super:Object.fromEntries(Object.entries(SUPER_INFO).map(([key,info])=>[key,info.name])),
  color:{cyan:'シアン',orange:'オレンジ',violet:'バイオレット',mint:'ミント',gold:'ゴールド',bone:'ボーン',pink:'ピンク',lime:'ライム'},
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

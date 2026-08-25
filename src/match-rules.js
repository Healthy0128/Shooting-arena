export const MATCH_RULES=Object.freeze({
  ko:Object.freeze({key:'ko',name:'90秒KO戦',shortLabel:'KO COUNT',duration:90,stocks:0}),
  stock:Object.freeze({key:'stock',name:'3ストック戦',shortLabel:'3 STOCK',duration:120,stocks:3})
});

function ruleFor(key){
  return MATCH_RULES[key]||MATCH_RULES.ko;
}

export function createMatchRulesController(initialRule='ko'){
  let rule=ruleFor(initialRule);
  let scores=[0,0];
  let stocks=[rule.stocks,rule.stocks];
  let timeRemaining=rule.duration;
  let suddenDeath=false;
  let finished=false;

  function getState(){
    return {
      ruleKey:rule.key,
      ruleName:rule.name,
      shortLabel:rule.shortLabel,
      scores:[...scores],
      stocks:[...stocks],
      timeRemaining,
      suddenDeath,
      finished
    };
  }

  function start(ruleKey=rule.key){
    rule=ruleFor(ruleKey);
    scores=[0,0];
    stocks=[rule.stocks,rule.stocks];
    timeRemaining=rule.duration;
    suddenDeath=false;
    finished=false;
    return getState();
  }

  function finishEvent(winner,reason){
    finished=true;
    return {type:'finish',winner,reason,finalKO:reason==='stock-empty'||reason==='sudden-death',state:getState()};
  }

  function onKO(victim,attacker){
    if(finished)return {type:'none',state:getState()};
    scores[attacker]++;
    if(rule.key==='stock')stocks[victim]=Math.max(0,stocks[victim]-1);
    if(suddenDeath)return finishEvent(attacker,'sudden-death');
    if(rule.key==='stock'&&stocks[victim]===0)return finishEvent(attacker,'stock-empty');
    return {type:'respawn',victim,attacker,finalKO:false,state:getState()};
  }

  function update(dt){
    if(finished||dt<=0)return null;
    timeRemaining=Math.max(0,timeRemaining-dt);
    if(timeRemaining>0)return null;

    if(suddenDeath){
      timeRemaining=30;
      return {type:'keep-fighting',state:getState()};
    }

    const values=rule.key==='stock'?stocks:scores;
    if(values[0]!==values[1])return finishEvent(values[0]>values[1]?0:1,'time');

    suddenDeath=true;
    timeRemaining=30;
    return {type:'sudden-death',state:getState()};
  }

  return {start,onKO,update,getState};
}

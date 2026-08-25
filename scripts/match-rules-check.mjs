import assert from 'node:assert/strict';
import { createMatchRulesController } from '../src/match-rules.js';

const ko=createMatchRulesController('ko');
assert.equal(ko.getState().timeRemaining,90);
assert.equal(ko.onKO(1,0).type,'respawn');
assert.equal(ko.onKO(1,0).type,'respawn');
assert.equal(ko.onKO(1,0).type,'respawn','KO戦は3KOで途中終了しない');
assert.equal(ko.update(90).winner,0,'KO戦は時間終了時のKO数で決着する');

ko.start('ko');
assert.equal(ko.update(90).type,'sudden-death');
assert.equal(ko.onKO(0,1).winner,1,'同点後は次のKOで決着する');

const stock=createMatchRulesController('stock');
assert.deepEqual(stock.getState().stocks,[3,3]);
assert.equal(stock.onKO(1,0).type,'respawn');
assert.equal(stock.onKO(1,0).type,'respawn');
const stockFinish=stock.onKO(1,0);
assert.equal(stockFinish.winner,0);
assert.deepEqual(stockFinish.state.stocks,[3,0]);

stock.start('stock');
stock.onKO(1,0);
assert.equal(stock.update(120).winner,0,'ストック戦は時間終了時の残機で決着する');

console.log('PASS: match rules');

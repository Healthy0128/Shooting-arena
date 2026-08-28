import assert from 'node:assert/strict';
import {qualityProfileFor,shiftedAutoLevel} from '../src/quality-controller.js';

assert.equal(qualityProfileFor('standard').pixelRatioCap,1.5,'standard quality must preserve detail');
assert.equal(qualityProfileFor('low').maxParticles,100,'low quality must cap particles');
assert.equal(qualityProfileFor('auto','reduced').key,'reduced','auto quality must use its measured level');
assert.equal(shiftedAutoLevel('standard',-1),'reduced','auto quality must degrade one step');
assert.equal(shiftedAutoLevel('reduced',-1),'low','auto quality must reach low mode');
assert.equal(shiftedAutoLevel('low',-1),'low','auto quality must not leave the supported range');
assert.equal(shiftedAutoLevel('reduced',1),'standard','auto quality must recover gradually');

console.log('quality controller checks passed');

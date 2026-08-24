import assert from 'node:assert/strict';
import { createFloatingStickController, isMovementGesture } from '../src/floating-stick.js';

class FakeElement{
  constructor(){
    this.listeners=new Map();
    this.style={};
    this.hidden=false;
  }
  addEventListener(type,listener){
    const list=this.listeners.get(type)||[];
    list.push(listener);
    this.listeners.set(type,list);
  }
  dispatch(type,event){
    (this.listeners.get(type)||[]).forEach(listener=>listener(event));
  }
  appendChild(child){return child}
  setAttribute(){}
  setPointerCapture(){}
  querySelector(){return new FakeElement()}
  replaceChildren(){}
  remove(){}
}

globalThis.document={
  body:new FakeElement(),
  createElement:()=>new FakeElement()
};

const canvas=new FakeElement();
const calls={moves:[],moveEnds:[],taps:[],fireStarts:[],fireMoves:[],fireEnds:[]};
createFloatingStickController({
  canvas,
  resolvePlayer:()=>0,
  onTouchInput:()=>{},
  onMove:(...args)=>calls.moves.push(args),
  onMoveEnd:(...args)=>calls.moveEnds.push(args),
  onTap:(...args)=>calls.taps.push(args),
  onFireStart:(...args)=>calls.fireStarts.push(args),
  onFireMove:(...args)=>calls.fireMoves.push(args),
  onFireEnd:(...args)=>calls.fireEnds.push(args)
});

const pointer=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,pointerType:'touch',preventDefault(){}});

assert.equal(isMovementGesture(8,8),false);
assert.equal(isMovementGesture(16,0),true);

canvas.dispatch('pointerdown',pointer(1,100,100));
canvas.dispatch('pointerup',pointer(1,104,103));
assert.equal(calls.taps.length,1,'short touch must shoot once');

canvas.dispatch('pointerdown',pointer(2,100,100));
canvas.dispatch('pointermove',pointer(2,120,100));
canvas.dispatch('pointerup',pointer(2,120,100));
assert.ok(calls.moves.length>=1,'swipe must start movement');
assert.equal(calls.moveEnds.length,1,'movement must stop on release');

canvas.dispatch('pointerdown',pointer(3,100,100));
await new Promise(resolve=>setTimeout(resolve,160));
canvas.dispatch('pointermove',pointer(3,106,104));
canvas.dispatch('pointerup',pointer(3,106,104));
assert.equal(calls.fireStarts.length,1,'stationary hold must start continuous fire');
assert.equal(calls.fireMoves.length,1,'held aim must follow small finger movement');
assert.equal(calls.fireEnds.length,1,'continuous fire must stop on release');

console.log('PASS: floating stick gesture lifecycle');

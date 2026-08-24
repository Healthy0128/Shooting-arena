export function createMatchScheduler({getGeneration,isPaused}){
  let tasks=[];

  function later(fn,ms){
    const task={fn,remaining:Math.max(0,ms)/1000,generation:getGeneration(),cancelled:false};
    tasks.push(task);
    return ()=>{task.cancelled=true};
  }

  function update(dt){
    if(isPaused())return;
    const generation=getGeneration();
    for(let i=tasks.length-1;i>=0;i--){
      const task=tasks[i];
      if(task.cancelled||task.generation!==generation){
        tasks.splice(i,1);
        continue;
      }
      task.remaining-=dt;
      if(task.remaining<=0){
        tasks.splice(i,1);
        task.fn();
      }
    }
  }

  function clear(){
    tasks=[];
  }

  return {later,update,clear};
}

import { initMenuUI } from './ui.js?v=6170';

initMenuUI();
import('./game.js?v=6170').catch(err=>{
  console.error('Failed to start game:',err);
});

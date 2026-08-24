import { initMenuUI } from './ui.js?v=6180';

initMenuUI();
import('./game.js?v=6180').catch(err=>{
  console.error('Failed to start game:',err);
});

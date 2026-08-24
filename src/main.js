import { initMenuUI } from './ui.js?v=6160';

initMenuUI();
import('./game.js?v=6160').catch(err=>{
  console.error('Failed to start game:',err);
});

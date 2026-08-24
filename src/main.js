import { initMenuUI } from './ui.js?v=6130';

initMenuUI();
import('./game.js?v=6141').catch(err=>{
  console.error('Failed to start game:',err);
});

import { initMenuUI } from './ui.js?v=6106';

initMenuUI();
import('./game.js?v=6110').catch(err=>{
  console.error('Failed to start game:',err);
});

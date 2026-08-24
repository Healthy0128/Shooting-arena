import { initMenuUI } from './ui.js?v=6120';

initMenuUI();
import('./game.js?v=6120').catch(err=>{
  console.error('Failed to start game:',err);
});

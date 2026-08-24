import { initMenuUI } from './ui.js?v=695';

initMenuUI();
import('./game.js?v=695').catch(err=>{
  console.error('Failed to start game:',err);
});

import { initMenuUI } from './ui.js?v=696';

initMenuUI();
import('./game.js?v=696').catch(err=>{
  console.error('Failed to start game:',err);
});

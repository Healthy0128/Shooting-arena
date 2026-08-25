import { initMenuUI } from './ui.js?v=6340';
import { initHelpUI } from './help-ui.js?v=6340';

initMenuUI();
initHelpUI();
import('./game.js?v=6340').catch(err=>{
  console.error('Failed to start game:',err);
});

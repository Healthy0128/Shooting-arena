import { initMenuUI } from './ui.js?v=6180';
import { initHelpUI } from './help-ui.js?v=6190';

initMenuUI();
initHelpUI();
import('./game.js?v=6190').catch(err=>{
  console.error('Failed to start game:',err);
});

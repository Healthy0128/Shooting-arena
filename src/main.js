import { initMenuUI } from './ui.js?v=6370';
import { initHelpUI } from './help-ui.js?v=6350';

initMenuUI();
initHelpUI();
import('./game.js?v=6370').catch(err=>{
  console.error('Failed to start game:',err);
});

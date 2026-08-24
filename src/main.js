import { initMenuUI } from './ui.js?v=6210';
import { initHelpUI } from './help-ui.js?v=6200';

initMenuUI();
initHelpUI();
import('./game.js?v=6290').catch(err=>{
  console.error('Failed to start game:',err);
});

import { initMenuUI } from './ui.js?v=6380';
import { initHelpUI } from './help-ui.js?v=6350';

initMenuUI();
initHelpUI();
import('./game.js?v=6390').catch(err=>{
  console.error('Failed to start game:',err);
});

// Game names and descriptions (the games themselves live in games-web/).
import type { GameId } from '../logic/state.ts';

export const GAMES: Record<GameId, { em: string; title: string; desc: string }> = {
  fieldgoal: { em: '🏈', title: 'Field Goal Frenzy', desc: 'Aim, beat the wind and kick it through the posts!' },
  derby: { em: '⚾', title: 'Home Run Derby', desc: 'Time your swing and smash home runs!' },
  unicorn: { em: '🦄', title: 'Unicorn Rainbow Dash', desc: 'Jump, dodge storms and catch stars!' },
  balloon: { em: '🎈', title: 'Balloon Spell Pop', desc: 'Pop letters to spell your words!' },
  memory: { em: '🧠', title: 'Memory Match', desc: 'Flip cards and find the pairs!' },
  icecream: { em: '🍦', title: 'Ice Cream Tower', desc: 'Drop scoops and stack them sky-high!' },
  space: { em: '🚀', title: 'Space Star Catcher', desc: 'Fly your rocket, catch stars, dodge comets!' },
  bonk: { em: '🐹', title: 'Garden Bonk', desc: 'Bonk the gophers but not the bunnies!' },
  race: { em: '🏎️', title: 'Race Car Rally', desc: 'Switch lanes, grab boosts and win the race!' },
  soccer: { em: '⚽', title: 'Penalty Kick Shootout', desc: 'Aim away from the goalie and score!' },
  hoops: { em: '🏀', title: 'Hoop Shot', desc: 'Time your shot to sink the basket!' },
  catcher: { em: '🧺', title: 'Letter Catcher', desc: 'Catch letters in order to spell your words!' },
  moonrocket: { em: '🌕', title: 'Moon Rocket', desc: 'Guess the letters to fuel your rocket!' },
  scramble: { em: '🔀', title: 'Scramble Rush', desc: 'Unscramble your words before time runs out!' },
  snake: { em: '🐍', title: 'Spelling Snake', desc: 'Steer the snake to eat letters in order!' },
  wheel: { em: '🎡', title: 'Spin & Spell', desc: 'Tap when the right letter spins to the arrow!' },
  detective: { em: '🔍', title: 'Letter Detective', desc: 'Find the missing letters in each word!' },
};

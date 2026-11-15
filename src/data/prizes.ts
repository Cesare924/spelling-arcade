// The Prize Counter's catalog. Prizes are for fun only: nothing here makes a game easier.
// Ids are saved in each kid's data, so never reuse or rename an id.

export type PrizeKind = 'sticker' | 'avatar' | 'look' | 'trophy';
/** Where a game look shows up. Only one look per slot can be on at a time. */
export type LookSlot = 'hoops' | 'snake' | 'bowling' | 'catcher' | 'tiles' | 'home'
  | 'unicorn' | 'dino' | 'puppy' | 'space' | 'moonrocket' | 'fishing' | 'beehive' | 'train' | 'soccer';
export interface Prize { id: string; kind: PrizeKind; em: string; name: string; price: number; slot?: LookSlot; where?: string }

export const PRIZES: Prize[] = [
  // Stickers: 10 to 30 tickets
  { id: 'st_unicorn', kind: 'sticker', em: '🦄', name: 'Unicorn sticker', price: 10 },
  { id: 'st_rocket', kind: 'sticker', em: '🚀', name: 'Rocket sticker', price: 10 },
  { id: 'st_butterfly', kind: 'sticker', em: '🦋', name: 'Butterfly sticker', price: 10 },
  { id: 'st_octopus', kind: 'sticker', em: '🐙', name: 'Octopus sticker', price: 15 },
  { id: 'st_rainbow', kind: 'sticker', em: '🌈', name: 'Rainbow sticker', price: 15 },
  { id: 'st_donut', kind: 'sticker', em: '🍩', name: 'Donut sticker', price: 15 },
  { id: 'st_dino', kind: 'sticker', em: '🦖', name: 'Dino sticker', price: 20 },
  { id: 'st_pizza', kind: 'sticker', em: '🍕', name: 'Pizza sticker', price: 20 },
  { id: 'st_guitar', kind: 'sticker', em: '🎸', name: 'Guitar sticker', price: 20 },
  { id: 'st_cactus', kind: 'sticker', em: '🌵', name: 'Cactus sticker', price: 20 },
  { id: 'st_crown', kind: 'sticker', em: '👑', name: 'Shiny crown', price: 30 },
  { id: 'st_gem', kind: 'sticker', em: '💎', name: 'Shiny gem', price: 30 },
  { id: 'st_star', kind: 'sticker', em: '🌟', name: 'Shiny star', price: 30 },
  { id: 'st_panda', kind: 'sticker', em: '🐼', name: 'Panda sticker', price: 10 },
  { id: 'st_ladybug', kind: 'sticker', em: '🐞', name: 'Ladybug sticker', price: 10 },
  { id: 'st_turtle', kind: 'sticker', em: '🐢', name: 'Turtle sticker', price: 10 },
  { id: 'st_whale', kind: 'sticker', em: '🐳', name: 'Whale sticker', price: 15 },
  { id: 'st_fox', kind: 'sticker', em: '🦊', name: 'Fox sticker', price: 15 },
  { id: 'st_cupcake', kind: 'sticker', em: '🧁', name: 'Cupcake sticker', price: 15 },
  { id: 'st_watermelon', kind: 'sticker', em: '🍉', name: 'Watermelon sticker', price: 15 },
  { id: 'st_planet', kind: 'sticker', em: '☄️', name: 'Comet sticker', price: 20 },
  { id: 'st_ufo', kind: 'sticker', em: '🛸', name: 'UFO sticker', price: 20 },
  { id: 'st_soccer', kind: 'sticker', em: '⚽', name: 'Soccer sticker', price: 20 },
  { id: 'st_basketball', kind: 'sticker', em: '🏀', name: 'Basketball sticker', price: 20 },
  { id: 'st_sunflower', kind: 'sticker', em: '🌻', name: 'Sunflower sticker', price: 20 },
  { id: 'st_volcano', kind: 'sticker', em: '🌋', name: 'Volcano sticker', price: 25 },
  { id: 'st_robot', kind: 'sticker', em: '🤖', name: 'Robot sticker', price: 25 },
  { id: 'st_medal', kind: 'sticker', em: '🥇', name: 'Gold medal', price: 30 },
  { id: 'st_trophy', kind: 'sticker', em: '🏆', name: 'Shiny trophy', price: 30 },
  { id: 'st_magic', kind: 'sticker', em: '🎩', name: 'Magic hat', price: 30 },
  // Avatars: 40 to 80 tickets (new pictures, not in the free set)
  { id: 'av_owl', kind: 'avatar', em: '🦉', name: 'Owl', price: 40 },
  { id: 'av_flamingo', kind: 'avatar', em: '🦢', name: 'Swan', price: 40 },
  { id: 'av_koala', kind: 'avatar', em: '🐨', name: 'Koala', price: 40 },
  { id: 'av_alien', kind: 'avatar', em: '👽', name: 'Alien', price: 60 },
  { id: 'av_robot', kind: 'avatar', em: '🤖', name: 'Robot', price: 80 },
  { id: 'av_dragon', kind: 'avatar', em: '🐲', name: 'Dragon', price: 80 },
  { id: 'av_penguin', kind: 'avatar', em: '🐺', name: 'Wolf', price: 40 },
  { id: 'av_hedgehog', kind: 'avatar', em: '🦔', name: 'Hedgehog', price: 40 },
  { id: 'av_sloth', kind: 'avatar', em: '🦝', name: 'Raccoon', price: 50 },
  { id: 'av_peacock', kind: 'avatar', em: '🦚', name: 'Peacock', price: 50 },
  { id: 'av_shark', kind: 'avatar', em: '🦈', name: 'Shark', price: 60 },
  { id: 'av_parrot', kind: 'avatar', em: '🦜', name: 'Parrot', price: 60 },
  { id: 'av_astronaut', kind: 'avatar', em: '👾', name: 'Space monster', price: 80 },
  { id: 'av_wizard', kind: 'avatar', em: '🧙', name: 'Wizard', price: 80 },
  // Game looks: 100 to 150 tickets
  { id: 'lk_hoops', kind: 'look', em: '🏀', name: 'Glowing basketball', price: 100, slot: 'hoops', where: 'Hoop Shot' },
  { id: 'lk_snake', kind: 'look', em: '🐍', name: 'Rainbow snake', price: 100, slot: 'snake', where: 'Spelling Snake' },
  { id: 'lk_bowling', kind: 'look', em: '🎳', name: 'Galaxy bowling ball', price: 120, slot: 'bowling', where: 'Bowling Buddies' },
  { id: 'lk_cart', kind: 'look', em: '🛒', name: 'Shopping cart catcher', price: 120, slot: 'catcher', where: 'Letter Catcher' },
  { id: 'lk_tiles', kind: 'look', em: '🍬', name: 'Candy letter tiles', price: 150, slot: 'tiles', where: 'Spelling practice' },
  { id: 'lk_night', kind: 'look', em: '🌌', name: 'Night sky home', price: 150, slot: 'home', where: 'Home screen' },
  { id: 'lk_kitten', kind: 'look', em: '🐱', name: 'Kitten fetch', price: 100, slot: 'puppy', where: 'Puppy Fetch' },
  { id: 'lk_kangaroo', kind: 'look', em: '🦘', name: 'Kangaroo jumper', price: 100, slot: 'dino', where: 'Dino Dash' },
  { id: 'lk_planet', kind: 'look', em: '🌍', name: 'Planet soccer ball', price: 100, slot: 'soccer', where: 'Penalty Kick Shootout' },
  { id: 'lk_butterfly', kind: 'look', em: '🦋', name: 'Butterfly helper', price: 100, slot: 'beehive', where: 'Spelling Bee Hive' },
  { id: 'lk_sailboat', kind: 'look', em: '⛵', name: 'Sailboat', price: 120, slot: 'fishing', where: 'Letter Fishing' },
  { id: 'lk_bullet', kind: 'look', em: '🚅', name: 'Bullet train', price: 120, slot: 'train', where: 'Letter Train' },
  { id: 'lk_dragon', kind: 'look', em: '🐉', name: 'Dragon runner', price: 120, slot: 'unicorn', where: 'Unicorn Rainbow Dash' },
  { id: 'lk_ufo', kind: 'look', em: '🛸', name: 'Flying saucer', price: 120, slot: 'space', where: 'Space Star Catcher' },
  { id: 'lk_moonufo', kind: 'look', em: '🛰️', name: 'Moon satellite', price: 120, slot: 'moonrocket', where: 'Moon Rocket' },
  { id: 'lk_ocean', kind: 'look', em: '🌊', name: 'Ocean letter tiles', price: 150, slot: 'tiles', where: 'Spelling practice' },
  { id: 'lk_mint', kind: 'look', em: '🍃', name: 'Mint letter tiles', price: 150, slot: 'tiles', where: 'Spelling practice' },
  { id: 'lk_sunset', kind: 'look', em: '🌅', name: 'Sunset home', price: 150, slot: 'home', where: 'Home screen' },
  { id: 'lk_forest', kind: 'look', em: '🌲', name: 'Forest home', price: 150, slot: 'home', where: 'Home screen' },
  // Top shelf: 300 to 1,000 tickets. These sit on the home screen's trophy shelf.
  { id: 'tp_teddy', kind: 'trophy', em: '🧸', name: 'Giant Teddy', price: 300 },
  { id: 'tp_puppy', kind: 'trophy', em: '🐶', name: 'Pet puppy', price: 400 },
  { id: 'tp_trophy', kind: 'trophy', em: '🏆', name: 'Golden trophy', price: 500 },
  { id: 'tp_wheel', kind: 'trophy', em: '🎡', name: 'Ferris wheel', price: 700 },
  { id: 'tp_cabinet', kind: 'trophy', em: '🕹️', name: 'Golden arcade cabinet', price: 1000 },
  { id: 'tp_giraffe', kind: 'trophy', em: '🦒', name: 'Giant giraffe', price: 350 },
  { id: 'tp_rocket', kind: 'trophy', em: '🚀', name: 'Rocket ship', price: 600 },
  { id: 'tp_castle', kind: 'trophy', em: '🏰', name: 'Castle', price: 800 },
  { id: 'tp_crown', kind: 'trophy', em: '👑', name: 'Royal crown', price: 900 },
  { id: 'tp_dragon', kind: 'trophy', em: '🐉', name: 'Golden dragon', price: 1500 },
];
const KIND_ORDER: Record<PrizeKind, number> = { sticker: 0, avatar: 1, look: 2, trophy: 3 };
// Sort each shelf cheapest first so kids see what they can get soon.
PRIZES.sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.price - b.price));

/** Colors for the home-screen card looks. Text colors keep strong contrast on each background. */
export const HOME_THEMES: Record<string, { bg: string; line: string; ink: string; soft: string; deco: string; decoColor: string }> = {
  lk_night: { bg: '#1e1b4b', line: '#312e81', ink: '#ffffff', soft: '#c7d2fe', deco: '✦ · ✧ · ✦ · ✧ · ✦', decoColor: '#fde68a' },
  lk_sunset: { bg: '#7c2d12', line: '#9a3412', ink: '#ffffff', soft: '#fed7aa', deco: '☀ · ☁ · ☀ · ☁ · ☀', decoColor: '#fdba74' },
  lk_forest: { bg: '#14532d', line: '#166534', ink: '#ffffff', soft: '#bbf7d0', deco: '▲ · ▲ · ▲ · ▲ · ▲', decoColor: '#86efac' },
};
/** Colors for the letter-tile looks in practice. */
export const TILE_THEMES: Record<string, { bg: string; line: string }> = {
  lk_tiles: { bg: '#fce7f3', line: '#ec4899' },
  lk_ocean: { bg: '#e0f2fe', line: '#0284c7' },
  lk_mint: { bg: '#dcfce7', line: '#16a34a' },
};
export const PRIZE_BY_ID: Record<string, Prize> = Object.fromEntries(PRIZES.map(p => [p.id, p]));
export const PRIZE_AVATARS = PRIZES.filter(p => p.kind === 'avatar').map(p => p.em);

export const SHELVES: { kind: PrizeKind | 'family'; label: string; blurb: string }[] = [
  { kind: 'sticker', label: 'Stickers', blurb: 'Collect them all for your sticker book.' },
  { kind: 'avatar', label: 'Avatars', blurb: 'New pictures for your profile.' },
  { kind: 'look', label: 'Game looks', blurb: 'Change how your games look.' },
  { kind: 'trophy', label: 'Top shelf', blurb: 'The big prizes. Save up!' },
  { kind: 'family', label: 'Family', blurb: 'Real prizes from your grown-ups.' },
];
export const KIND_NOTE: Record<PrizeKind, string> = {
  sticker: 'Goes in your sticker book.',
  avatar: 'Use it as your profile picture.',
  look: 'Turn it on in My Prizes.',
  trophy: 'Shows up on your home screen.',
};

/** Pictures grown-ups can choose for family prizes. */
export const FAMILY_EMOJI = ['🍝', '🍕', '🍦', '🍪', '🌳', '🏊', '🚲', '🎬', '📚', '🎮', '🎨', '🧩', '🎢', '🏕️', '🎳', '🧁', '🌙', '🎁'];

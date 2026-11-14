// The Prize Counter's catalog. Prizes are for fun only: nothing here makes a game easier.
// Ids are saved in each kid's data, so never reuse or rename an id.

export type PrizeKind = 'sticker' | 'avatar' | 'look' | 'trophy';
/** Where a game look shows up. Only one look per slot can be on at a time. */
export type LookSlot = 'hoops' | 'snake' | 'bowling' | 'catcher' | 'tiles' | 'home';
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
  // Avatars: 40 to 80 tickets (new pictures, not in the free set)
  { id: 'av_owl', kind: 'avatar', em: '🦉', name: 'Owl', price: 40 },
  { id: 'av_flamingo', kind: 'avatar', em: '🦩', name: 'Flamingo', price: 40 },
  { id: 'av_koala', kind: 'avatar', em: '🐨', name: 'Koala', price: 40 },
  { id: 'av_alien', kind: 'avatar', em: '👽', name: 'Alien', price: 60 },
  { id: 'av_robot', kind: 'avatar', em: '🤖', name: 'Robot', price: 80 },
  { id: 'av_dragon', kind: 'avatar', em: '🐲', name: 'Dragon', price: 80 },
  // Game looks: 100 to 150 tickets
  { id: 'lk_hoops', kind: 'look', em: '🏀', name: 'Glowing basketball', price: 100, slot: 'hoops', where: 'Hoop Shot' },
  { id: 'lk_snake', kind: 'look', em: '🐍', name: 'Rainbow snake', price: 100, slot: 'snake', where: 'Word Snake' },
  { id: 'lk_bowling', kind: 'look', em: '🎳', name: 'Galaxy bowling ball', price: 120, slot: 'bowling', where: 'Strike Lanes' },
  { id: 'lk_cart', kind: 'look', em: '🛒', name: 'Shopping cart catcher', price: 120, slot: 'catcher', where: 'Letter Catcher' },
  { id: 'lk_tiles', kind: 'look', em: '🍬', name: 'Candy letter tiles', price: 150, slot: 'tiles', where: 'Spelling practice' },
  { id: 'lk_night', kind: 'look', em: '🌌', name: 'Night sky home', price: 150, slot: 'home', where: 'Home screen' },
  // Top shelf: 300 to 1,000 tickets. These sit on the home screen's trophy shelf.
  { id: 'tp_teddy', kind: 'trophy', em: '🧸', name: 'Giant Teddy', price: 300 },
  { id: 'tp_puppy', kind: 'trophy', em: '🐶', name: 'Pet puppy', price: 400 },
  { id: 'tp_trophy', kind: 'trophy', em: '🏆', name: 'Golden trophy', price: 500 },
  { id: 'tp_wheel', kind: 'trophy', em: '🎡', name: 'Ferris wheel', price: 700 },
  { id: 'tp_cabinet', kind: 'trophy', em: '🕹️', name: 'Golden arcade cabinet', price: 1000 },
];
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
export const FAMILY_EMOJI = ['🍝', '🍕', '🍦', '🍪', '🌳', '🏊', '🚲', '🎬', '📚', '🎮', '🎨', '🧩', '🛝', '🏕️', '🎳', '🧁', '🌙', '🎁'];

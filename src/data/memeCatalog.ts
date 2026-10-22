export interface MemeTemplate {
  id: string;
  name: string;
  category: 'viral' | 'animated-gif' | 'classic' | 'chaos' | 'reactions';
  url: string;
  soundEffect: string;
  aspectRatio: number;
  tags: string[];
}

export const MEME_CATALOG: MemeTemplate[] = [
  // Viral & Animated GIFs
  {
    id: 'popcat',
    name: 'Popcat',
    category: 'animated-gif',
    url: 'https://media.tenor.com/7vjP5h9w8hIAAAAj/pop-cat-cat.gif',
    soundEffect: 'pop',
    aspectRatio: 1,
    tags: ['cat', 'pop', 'classic', 'cute', 'animal', 'mouth']
  },
  {
    id: 'doge',
    name: 'Doge Wow',
    category: 'viral',
    url: 'https://media.tenor.com/2K1z9_p_H6cAAAAj/doge.gif',
    soundEffect: 'boing',
    aspectRatio: 1,
    tags: ['doge', 'shiba', 'wow', 'crypto', 'dog', 'animal']
  },
  {
    id: 'nyan-cat',
    name: 'Nyan Cat',
    category: 'animated-gif',
    url: 'https://media.tenor.com/2roX3uxz_68AAAAj/cat-space.gif',
    soundEffect: 'laser',
    aspectRatio: 1.4,
    tags: ['rainbow', 'cat', 'pixel', 'space', 'music']
  },
  {
    id: 'bongo-cat',
    name: 'Bongo Cat',
    category: 'animated-gif',
    url: 'https://media.tenor.com/qL8Y0Xb2Z9MAAAAj/bongo-cat.gif',
    soundEffect: 'pop',
    aspectRatio: 1.2,
    tags: ['bongo', 'drums', 'cat', 'music', 'cute']
  },
  {
    id: 'gigachad',
    name: 'GigaChad',
    category: 'viral',
    url: 'https://media.tenor.com/k91cZ-k4P24AAAAj/gigachad-chad.gif',
    soundEffect: 'airhorn',
    aspectRatio: 0.8,
    tags: ['chad', 'jawline', 'based', 'muscle', 'face']
  },
  {
    id: 'skull-spin',
    name: 'Spinning Skull',
    category: 'chaos',
    url: 'https://media.tenor.com/aC-aMlh5c2AAAAAj/skull-spinning.gif',
    soundEffect: 'vine-boom',
    aspectRatio: 1,
    tags: ['skull', 'spooky', '3d', 'bad-to-the-bone', 'skeleton', 'dead']
  },
  {
    id: 'fire-flames',
    name: 'Pure Fire',
    category: 'chaos',
    url: 'https://media.tenor.com/4PqYJvQ_YwIAAAAj/fire-burning.gif',
    soundEffect: 'explosion',
    aspectRatio: 1,
    tags: ['fire', 'lit', 'flames', 'hot', 'burn']
  },
  {
    id: 'dancing-banana',
    name: 'Dancing Banana',
    category: 'classic',
    url: 'https://media.tenor.com/mO_0aQpGkZIAAAAj/banana-dancing.gif',
    soundEffect: 'boing',
    aspectRatio: 0.8,
    tags: ['banana', 'peanut-butter-jelly', 'retro', 'dance']
  },
  {
    id: 'pepe-hype',
    name: 'Pepe Rainbow Hype',
    category: 'viral',
    url: 'https://media.tenor.com/7bQyU13s3cAAAAAj/pepe-dance.gif',
    soundEffect: 'airhorn',
    aspectRatio: 1,
    tags: ['pepe', 'frog', 'dance', 'party', 'hype']
  },
  {
    id: 'rickroll',
    name: 'Never Gonna Give You Up',
    category: 'classic',
    url: 'https://media.tenor.com/x8v1oNUOmg4AAAAj/rickroll-roll.gif',
    soundEffect: 'disco',
    aspectRatio: 1,
    tags: ['rick', 'dance', 'rickroll', 'music', 'rick-astley']
  },
  {
    id: 'deal-with-it',
    name: 'Deal With It Glasses',
    category: 'classic',
    url: 'https://media.tenor.com/gKj3aG30c1YAAAAj/deal-with-it-shades.gif',
    soundEffect: 'vine-boom',
    aspectRatio: 2,
    tags: ['glasses', 'shades', 'cool', 'swag', 'sunglasses']
  },
  {
    id: 'sponge-mock',
    name: 'Mocking Sponge',
    category: 'viral',
    url: 'https://media.tenor.com/O6aC93q-f8IAAAAj/spongebob-mocking.gif',
    soundEffect: 'quack',
    aspectRatio: 1.1,
    tags: ['spongebob', 'mocking', 'meme', 'chicken', 'funny']
  },
  {
    id: 'confetti-explosion',
    name: 'Party Confetti',
    category: 'chaos',
    url: 'https://media.tenor.com/iJ7_d397lPMAAAAj/confetti-celebrate.gif',
    soundEffect: 'high-five',
    aspectRatio: 1,
    tags: ['celebrate', 'party', 'confetti', 'yay', 'birthday']
  },
  {
    id: 'cat-vibing',
    name: 'Cat Vibing Jam',
    category: 'animated-gif',
    url: 'https://media.tenor.com/kHdt7B_Rk_0AAAAj/cat-headbang.gif',
    soundEffect: 'disco',
    aspectRatio: 1,
    tags: ['cat', 'headbang', 'jam', 'vibing', 'music']
  },
  // Instagram Style Reactions & Cutouts
  {
    id: 'heart-fire',
    name: 'Heart on Fire',
    category: 'reactions',
    url: 'https://media.tenor.com/2Xy-gNl-a8UAAAAj/heart-fire.gif',
    soundEffect: 'pop',
    aspectRatio: 1,
    tags: ['heart', 'love', 'fire', 'insta', 'reaction']
  },
  {
    id: 'laugh-crying',
    name: 'LMAO Laugh',
    category: 'reactions',
    url: 'https://media.tenor.com/9v83O4vWz78AAAAj/laughing-tears.gif',
    soundEffect: 'quack',
    aspectRatio: 1,
    tags: ['lol', 'laugh', 'crying', 'funny', 'reaction']
  },
  {
    id: 'mind-blown',
    name: 'Mind Blown Exploding Head',
    category: 'reactions',
    url: 'https://media.tenor.com/39wF4X8j-bYAAAAj/mind-blown.gif',
    soundEffect: 'explosion',
    aspectRatio: 1,
    tags: ['mindblown', 'explosion', 'shock', 'brain', 'reaction']
  },
  {
    id: 'dancing-duck',
    name: 'Subaru Dancing Duck',
    category: 'animated-gif',
    url: 'https://media.tenor.com/90wA7_A_k_cAAAAj/subaru-duck-dancing.gif',
    soundEffect: 'quack',
    aspectRatio: 1,
    tags: ['duck', 'dance', 'cute', 'bird', 'vibing']
  },
  {
    id: 'groove-cat',
    name: 'Spinning Rainbow Cat',
    category: 'animated-gif',
    url: 'https://media.tenor.com/V6mG0eG0eOAAAAAj/cat-rainbow.gif',
    soundEffect: 'laser',
    aspectRatio: 1,
    tags: ['cat', 'spin', 'rainbow', 'rave', 'hyper']
  },
  {
    id: 'trollface',
    name: 'Trollface Smile',
    category: 'classic',
    url: 'https://media.tenor.com/mO_p_G5G7nEAAAAj/troll-face.gif',
    soundEffect: 'boing',
    aspectRatio: 1.2,
    tags: ['troll', 'rage', 'problem', 'classic']
  }
];

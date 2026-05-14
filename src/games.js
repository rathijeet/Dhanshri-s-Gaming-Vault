// Game posters use Steam CDN where available.
// Games without an `image` field render a styled fallback poster automatically.

export const GAMES = {
  ps5: [
    {
      title: "Marvel's Spider-Man 2",
      genre: 'Action-Adventure',
      year: 2023,
      developer: 'Insomniac Games',
      players: 'Single Player',
      description:
        'Swing through New York as both Peter Parker and Miles Morales. Face off against Venom and Kraven the Hunter in this action-packed sequel with seamless protagonist switching.',
    },
    {
      title: 'God of War Ragnarök',
      genre: 'Action-RPG',
      year: 2022,
      developer: 'Santa Monica Studio',
      players: 'Single Player',
      description:
        'Kratos and Atreus journey through the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle that will end the world.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg',
    },
    {
      title: 'EA Sports FC 24',
      genre: 'Football',
      year: 2023,
      developer: 'EA Sports',
      players: 'Single & Multiplayer',
      description:
        'The first football game under the EA Sports FC banner. Authentic gameplay with HyperMotionV technology and over 19,000 licensed players across 700+ teams.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900.jpg',
    },
    {
      title: 'Gran Turismo 7',
      genre: 'Racing',
      year: 2022,
      developer: 'Polyphony Digital',
      players: 'Single & Multiplayer',
      description:
        'The most comprehensive racing simulator yet. Features 400+ cars across 90+ track layouts, classic GT modes, livery editor, and competitive online racing.',
    },
    {
      title: 'Horizon Forbidden West',
      genre: 'Action-RPG',
      year: 2022,
      developer: 'Guerrilla Games',
      players: 'Single Player',
      description:
        'Aloy ventures into a stunning post-apocalyptic frontier filled with mysterious tribes, deadly machines, and a mounting threat to all life on Earth.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg',
    },
    {
      title: "Demon's Souls",
      genre: 'Souls-like',
      year: 2020,
      developer: 'Bluepoint Games',
      players: 'Single Player (Online Co-op)',
      description:
        'A stunning PS5 remake of the genre-defining classic. Battle through the haunting kingdom of Boletaria with razor-sharp visuals and brutal combat.',
    },
    {
      title: 'Ratchet & Clank: Rift Apart',
      genre: 'Platformer',
      year: 2021,
      developer: 'Insomniac Games',
      players: 'Single Player',
      description:
        'A dimension-hopping platformer that showcases the PS5 SSD. Blast through alternate universes with Ratchet, Clank, and the dimension-displaced Lombax, Rivet.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1895880/library_600x900.jpg',
    },
    {
      title: 'Final Fantasy XVI',
      genre: 'RPG',
      year: 2023,
      developer: 'Square Enix',
      players: 'Single Player',
      description:
        'A dark-fantasy RPG set in the realm of Valisthea. Play as Clive Rosfield, a sworn shield turned vengeance-driven warrior unraveling the mystery of the Eikons.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2515020/library_600x900.jpg',
    },
  ],
  xbox: [
    {
      title: 'Battlefield 4',
      genre: 'FPS',
      year: 2013,
      developer: 'DICE',
      players: 'Single & Multiplayer',
      description:
        'Large-scale military FPS with destructible environments and dynamic "Levolution" map changes. 64-player battles across land, sea, and air.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1238860/library_600x900.jpg',
    },
    {
      title: 'Far Cry 5',
      genre: 'FPS',
      year: 2018,
      developer: 'Ubisoft Montreal',
      players: 'Single & Co-op',
      description:
        'Take down a doomsday cult in rural Hope County, Montana. Open-world FPS with two-player co-op and a stranger-than-fiction storyline.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/552520/library_600x900.jpg',
    },
    {
      title: 'Grand Theft Auto V',
      genre: 'Open World',
      year: 2013,
      developer: 'Rockstar Games',
      players: 'Single & Online',
      description:
        'Modern-classic open-world experience. Switch between three protagonists across the sprawling criminal underworld of Los Santos and Blaine County.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',
    },
    {
      title: 'WWE 2K19',
      genre: 'Wrestling',
      year: 2018,
      developer: 'Yuke\'s / Visual Concepts',
      players: 'Single & Multiplayer',
      description:
        'Step into the ring with WWE\'s biggest superstars. Features 2K Showcase, MyCareer, Universe mode, and deep creation tools for custom wrestlers and arenas.',
    },
    {
      title: 'FIFA 21',
      genre: 'Football',
      year: 2020,
      developer: 'EA Sports',
      players: 'Single & Multiplayer',
      description:
        'Authentic football with new attacking creativity and natural defending. Includes UEFA Champions League, 30+ leagues, and Ultimate Team.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1313860/library_600x900.jpg',
    },
    {
      title: "Assassin's Creed Odyssey",
      genre: 'Action-RPG',
      year: 2018,
      developer: 'Ubisoft Quebec',
      players: 'Single Player',
      description:
        'Action-RPG set in ancient Greece. Forge your destiny as a Spartan mercenary in the Peloponnesian War, with branching dialogue and multiple endings.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/812140/library_600x900.jpg',
    },
    {
      title: 'Max Payne 3',
      genre: 'Action',
      year: 2012,
      developer: 'Rockstar Studios',
      players: 'Single & Multiplayer',
      description:
        'Cinematic third-person shooter starring a battered, embittered Max relocating to São Paulo. Iconic bullet-time mechanics with brutal, weighty gunplay.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/204100/library_600x900.jpg',
    },
    {
      title: 'Cricket 19',
      genre: 'Cricket',
      year: 2019,
      developer: 'Big Ant Studios',
      players: 'Single & Multiplayer',
      description:
        'The official Ashes cricket simulation. Includes career mode, full ICC tournament gameplay, plus deep player and stadium customization.',
    },
  ],
}

const GENRE_ICON = {
  FPS: 'military_tech',
  Football: 'sports_soccer',
  Cricket: 'sports_cricket',
  Wrestling: 'sports_mma',
  Racing: 'speed',
  'Open World': 'public',
  Action: 'bolt',
  'Action-RPG': 'auto_stories',
  'Action-Adventure': 'rocket_launch',
  RPG: 'auto_stories',
  'Souls-like': 'local_fire_department',
  Platformer: 'stairs',
}

export function iconForGenre(genre) {
  return GENRE_ICON[genre] || 'sports_esports'
}

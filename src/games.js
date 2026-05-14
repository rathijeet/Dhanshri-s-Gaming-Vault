// Game posters use Steam CDN where available.
// Games without an `image` field render a styled fallback poster automatically.
// `youtubeId` is the 11-char YouTube video ID for the trailer (lazy-loaded on click).

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
      image:
        'https://images.wallpapersden.com/image/download/marvel-s-spider-man-2-peter_bmdqZW2UmZqaraWkpJRobWllrWdma2U.jpg',
      youtubeId: 'nq1M_Wc4FIc',
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
      youtubeId: 'hfJ4Km46A-0',
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
      youtubeId: 'XhP3Xh4LMA8',
    },
    {
      title: 'Gran Turismo 7',
      genre: 'Racing',
      year: 2022,
      developer: 'Polyphony Digital',
      players: 'Single & Multiplayer',
      description:
        'The most comprehensive racing simulator yet. Features 400+ cars across 90+ track layouts, classic GT modes, livery editor, and competitive online racing.',
      youtubeId: '1tBUsXIkG1A',
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
      youtubeId: 'Lq594XmpPBg',
    },
    {
      title: "Demon's Souls",
      genre: 'Souls-like',
      year: 2020,
      developer: 'Bluepoint Games',
      players: 'Single Player (Online Co-op)',
      description:
        'A stunning PS5 remake of the genre-defining classic. Battle through the haunting kingdom of Boletaria with razor-sharp visuals and brutal combat.',
      youtubeId: '2TMs2E6cms4',
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
      youtubeId: '55PRv_e00wc',
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
      youtubeId: 'gV5rIW1Qums',
    },
  ],
  xbox: [
    {
      title: 'Ashes Cricket',
      genre: 'Cricket',
      year: 2017,
      developer: 'Big Ant Studios',
      players: 'Single & Multiplayer',
      description:
        "The official video game of cricket's greatest rivalry. Bat, bowl, and field your way through the Ashes series with realistic player likenesses and TV-style presentation.",
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/444450/library_600x900.jpg',
      youtubeId: '-BkZ4oFRxMs',
    },
    {
      title: 'Asphalt 9: Legends',
      genre: 'Racing',
      year: 2018,
      developer: 'Gameloft',
      players: 'Single & Multiplayer',
      description:
        'Free-to-play arcade racer with 100+ cars across 70+ tracks. Pull off cinematic stunts and compete in real-time online multiplayer races.',
      youtubeId: 'ot63S91Ihwk',
    },
    {
      title: "Assassin's Creed Origins",
      genre: 'Action-RPG',
      year: 2017,
      developer: 'Ubisoft Montreal',
      players: 'Single Player',
      description:
        'Action-RPG set in ancient Egypt during the Ptolemaic period. Play as Bayek, a Medjay protecting his people, and witness the birth of the Assassin Brotherhood.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/582160/library_600x900.jpg',
      youtubeId: 'cK4iAjzAoas',
    },
    {
      title: 'Battlefield 4',
      genre: 'FPS',
      year: 2013,
      developer: 'DICE',
      players: 'Single & Multiplayer',
      description:
        'Large-scale military FPS with destructible environments and dynamic "Levolution" map changes. 64-player battles across land, sea, and air.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1238860/library_600x900.jpg',
      youtubeId: 'P9fK77eE7fs',
    },
    {
      title: 'EA Sports FIFA 20',
      genre: 'Football',
      year: 2019,
      developer: 'EA Sports',
      players: 'Single & Multiplayer',
      description:
        'Featuring VOLTA Football for street-style 3v3, 4v4, and 5v5 matches. Includes UEFA Champions League and 700+ teams across 30+ leagues.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1056610/library_600x900.jpg',
      youtubeId: 'vgQNOIhRsV4',
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
      youtubeId: 'Kdaoe4hbMso',
    },
    {
      title: 'Forza Motorsport 6',
      genre: 'Racing',
      year: 2015,
      developer: 'Turn 10 Studios',
      players: 'Single & Multiplayer',
      description:
        'Open-air racing across 26 world-famous locations with 460+ Forzavista cars. Features dynamic weather, night racing, and 24-driver online races.',
      youtubeId: 'YPziu4TBLts',
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
      youtubeId: 'hvoD7ehZPcM',
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
      youtubeId: '4Uc_dbG7MR8',
    },
    {
      title: 'Mad Max',
      genre: 'Open World',
      year: 2015,
      developer: 'Avalanche Studios',
      players: 'Single Player',
      description:
        'Post-apocalyptic open-world driving and combat. Build your dream wasteland car and battle ferocious gangs to become the warrior the wasteland deserves.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/234140/library_600x900.jpg',
      youtubeId: '1suYdGmns5E',
    },
    {
      title: 'Need for Speed Heat',
      genre: 'Racing',
      year: 2019,
      developer: 'Ghost Games',
      players: 'Single & Multiplayer',
      description:
        'Race by day in sanctioned events, cruise the streets at night in illegal races. Customize your car and build your reputation as a street legend.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1222680/library_600x900.jpg',
      youtubeId: '9ewiJJe_nYI',
    },
    {
      title: 'Need for Speed Payback',
      genre: 'Racing',
      year: 2017,
      developer: 'Ghost Games',
      players: 'Single & Multiplayer',
      description:
        'Action-driving fantasy featuring three playable characters with unique skills. Build out your derelict cars into custom street machines.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1262540/library_600x900.jpg',
      youtubeId: 'kc-OcOduEx0',
    },
    {
      title: 'Resident Evil 4',
      genre: 'Survival Horror',
      year: 2023,
      developer: 'Capcom',
      players: 'Single Player',
      description:
        "Reimagined survival horror. Leon S. Kennedy heads to a remote European village to rescue the President's kidnapped daughter from a mysterious cult.",
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg',
      youtubeId: 'E69tKrfEQag',
    },
    {
      title: 'Rise of the Tomb Raider',
      genre: 'Action-Adventure',
      year: 2015,
      developer: 'Crystal Dynamics',
      players: 'Single Player',
      description:
        'Lara Croft uncovers an ancient mystery in the wilds of Siberia while battling a sinister organization. Features deep weapon upgrades and traversal.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/391220/library_600x900.jpg',
      youtubeId: 'qiYiddjc6cU',
    },
    {
      title: 'Shadow of the Tomb Raider',
      genre: 'Action-Adventure',
      year: 2018,
      developer: 'Eidos Montréal',
      players: 'Single Player',
      description:
        'Lara Croft must master a deadly jungle, overcome terrifying tombs, and survive her darkest hour in the climactic finale of the origin trilogy.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/750920/library_600x900.jpg',
      youtubeId: 'XYtyeqVQnRI',
    },
    {
      title: 'The Witcher 3: Wild Hunt',
      genre: 'RPG',
      year: 2015,
      developer: 'CD Projekt Red',
      players: 'Single Player',
      description:
        'Story-driven open-world RPG. Play as monster hunter Geralt of Rivia, navigate a war-torn continent, and face the otherworldly Wild Hunt.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg',
      youtubeId: 'XHrskkHf958',
    },
    {
      title: 'WWE 2K15',
      genre: 'Wrestling',
      year: 2014,
      developer: 'Visual Concepts',
      players: 'Single & Multiplayer',
      description:
        'Step into MyCareer and rise from rookie to WWE Superstar. Features 2K Showcase highlighting iconic CM Punk vs John Cena and HBK vs HHH rivalries.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/387260/library_600x900.jpg',
      youtubeId: '6gGMjhqbi2c',
    },
    {
      title: 'WWE 2K19',
      genre: 'Wrestling',
      year: 2018,
      developer: "Yuke's / Visual Concepts",
      players: 'Single & Multiplayer',
      description:
        "Step into the ring with WWE's biggest superstars. Features 2K Showcase, MyCareer, Universe mode, and deep creation tools for custom wrestlers and arenas.",
      youtubeId: '3L1Zmmbou3s',
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
  'Survival Horror': 'skull',
  Platformer: 'stairs',
}

export function iconForGenre(genre) {
  return GENRE_ICON[genre] || 'sports_esports'
}

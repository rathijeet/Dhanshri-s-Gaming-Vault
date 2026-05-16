// Game posters use Steam CDN where available.
// Games without an `image` field render a styled fallback poster automatically.
// `youtubeId` is the 11-char YouTube video ID for the trailer (lazy-loaded on click).

export const GAMES = {
  ps5: [
    {
      title: 'Grand Theft Auto V Premium Edition',
      genre: 'Open World',
      year: 2013,
      developer: 'Rockstar Games',
      players: 'Single & Online',
      description:
        'Modern-classic open-world experience. Switch between three protagonists across the sprawling criminal underworld of Los Santos and Blaine County. Premium Edition bundles GTA Online.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',
      youtubeId: 'hvoD7ehZPcM',
    },
    {
      title: 'The Last of Us Remastered',
      genre: 'Action-Adventure',
      year: 2014,
      developer: 'Naughty Dog',
      players: 'Single Player',
      description:
        'Twenty years after a fungal pandemic ravages civilization, hardened survivor Joel is hired to smuggle 14-year-old Ellie across a brutal United States. PS4 remaster with 1080p visuals and bonus DLC.',
      youtubeId: 'ygVPHxkokAE',
    },
    {
      title: 'inFAMOUS: Second Son',
      genre: 'Action-Adventure',
      year: 2014,
      developer: 'Sucker Punch Productions',
      players: 'Single Player',
      description:
        'Seattle has become a totalitarian quarantine zone. Delsin Rowe, a young man with newly awakened conduit powers, must decide whether to fight back as a hero or anti-hero in this open-world action-adventure.',
      youtubeId: 'bGbC2KPCP_E',
    },
    {
      title: "Tom Clancy's Ghost Recon Wildlands",
      genre: 'Open World',
      year: 2017,
      developer: 'Ubisoft Paris',
      players: 'Single & Co-op',
      description:
        'Lead an elite four-soldier squad across a sprawling open-world Bolivia to dismantle the Santa Blanca drug cartel. Play solo with AI teammates or in seamless four-player co-op.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/460930/library_600x900.jpg',
      youtubeId: 'KL8DcwE16rU',
    },
    {
      title: 'God of War',
      genre: 'Action-Adventure',
      year: 2018,
      developer: 'Santa Monica Studio',
      players: 'Single Player',
      description:
        'Kratos lives as a man in the realm of Norse Gods and monsters. Now a father, he must teach his son Atreus to survive in this brutal new world while confronting the consequences of his past.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg',
      youtubeId: 'wdARoJXeGyk',
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
      youtubeId: 'g1wr0DfV73E',
    },
    {
      title: 'Horizon Zero Dawn Complete Edition',
      genre: 'Action-RPG',
      year: 2017,
      developer: 'Guerrilla Games',
      players: 'Single Player',
      description:
        'Take on the role of skilled hunter Aloy as she explores a vibrant and lush world inhabited by mysterious mechanized creatures. Complete Edition bundles The Frozen Wilds expansion.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/library_600x900.jpg',
      youtubeId: 'wzx96gYA8ek',
    },
    {
      title: "Ghost of Tsushima Director's Cut",
      genre: 'Action-Adventure',
      year: 2020,
      developer: 'Sucker Punch Productions',
      players: 'Single Player',
      description:
        'The year is 1274. As Jin Sakai, forge a new path and wage an unconventional war against the Mongol invasion. Director’s Cut adds the full Iki Island expansion.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/library_600x900.jpg',
      youtubeId: '0HTfLqHoTmg',
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
      youtubeId: 'isN_Y9ULtXY',
    },
    {
      title: "Marvel's Spider-Man: Miles Morales",
      genre: 'Action-Adventure',
      year: 2020,
      developer: 'Insomniac Games',
      players: 'Single Player',
      description:
        "Experience the rise of Miles Morales as he masters explosive new powers and becomes his own Spider-Man, caught between a high-tech criminal army and a brilliant energy corporation in a snowy New York.",
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1817190/library_600x900.jpg',
      youtubeId: 'U-1cn1yOKYc',
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
      youtubeId: 'XLZN63UxAOM',
    },
    {
      title: "Assassin's Creed Shadows",
      genre: 'Action-RPG',
      year: 2025,
      developer: 'Ubisoft Quebec',
      players: 'Single Player',
      description:
        'Feudal Japan, late 16th century. Play as Naoe, a stealthy shinobi from Iga, and Yasuke, a legendary African samurai. Two complementary playstyles in a vast, dynamic open-world Japan.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/3159330/library_600x900.jpg',
      youtubeId: 'aURzPQG5naA',
    },
    {
      title: "Marvel's Spider-Man 2",
      genre: 'Action-Adventure',
      year: 2023,
      developer: 'Insomniac Games',
      players: 'Single Player',
      description:
        'Swing through New York as both Peter Parker and Miles Morales. Face off against Venom and Kraven the Hunter in this action-packed sequel with seamless protagonist switching.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2651280/library_600x900.jpg',
      youtubeId: 'DdndgMIuIGA',
    },
  ],
  ps4: [
    {
      title: 'Grand Theft Auto V Premium Edition',
      genre: 'Open World',
      year: 2013,
      developer: 'Rockstar Games',
      players: 'Single & Online',
      description:
        'Modern-classic open-world experience. Switch between three protagonists across the sprawling criminal underworld of Los Santos and Blaine County. Premium Edition bundles GTA Online.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg',
      youtubeId: 'hvoD7ehZPcM',
    },
    {
      title: 'The Last of Us Remastered',
      genre: 'Action-Adventure',
      year: 2014,
      developer: 'Naughty Dog',
      players: 'Single Player',
      description:
        'Twenty years after a fungal pandemic ravages civilization, hardened survivor Joel is hired to smuggle 14-year-old Ellie across a brutal United States. PS4 remaster with 1080p visuals and bonus DLC.',
      youtubeId: 'ygVPHxkokAE',
    },
    {
      title: 'inFAMOUS: Second Son',
      genre: 'Action-Adventure',
      year: 2014,
      developer: 'Sucker Punch Productions',
      players: 'Single Player',
      description:
        'Seattle has become a totalitarian quarantine zone. Delsin Rowe, a young man with newly awakened conduit powers, must decide whether to fight back as a hero or anti-hero in this open-world action-adventure.',
      youtubeId: 'bGbC2KPCP_E',
    },
    {
      title: "Tom Clancy's Ghost Recon Wildlands",
      genre: 'Open World',
      year: 2017,
      developer: 'Ubisoft Paris',
      players: 'Single & Co-op',
      description:
        'Lead an elite four-soldier squad across a sprawling open-world Bolivia to dismantle the Santa Blanca drug cartel. Play solo with AI teammates or in seamless four-player co-op.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/460930/library_600x900.jpg',
      youtubeId: 'KL8DcwE16rU',
    },
    {
      title: 'God of War',
      genre: 'Action-Adventure',
      year: 2018,
      developer: 'Santa Monica Studio',
      players: 'Single Player',
      description:
        'Kratos lives as a man in the realm of Norse Gods and monsters. Now a father, he must teach his son Atreus to survive in this brutal new world while confronting the consequences of his past.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/library_600x900.jpg',
      youtubeId: 'wdARoJXeGyk',
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
      youtubeId: 'g1wr0DfV73E',
    },
    {
      title: 'Horizon Zero Dawn Complete Edition',
      genre: 'Action-RPG',
      year: 2017,
      developer: 'Guerrilla Games',
      players: 'Single Player',
      description:
        'Take on the role of skilled hunter Aloy as she explores a vibrant and lush world inhabited by mysterious mechanized creatures. Complete Edition bundles The Frozen Wilds expansion.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/library_600x900.jpg',
      youtubeId: 'wzx96gYA8ek',
    },
    {
      title: "Ghost of Tsushima Director's Cut",
      genre: 'Action-Adventure',
      year: 2020,
      developer: 'Sucker Punch Productions',
      players: 'Single Player',
      description:
        'The year is 1274. As Jin Sakai, forge a new path and wage an unconventional war against the Mongol invasion. Director’s Cut adds the full Iki Island expansion.',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/library_600x900.jpg',
      youtubeId: '0HTfLqHoTmg',
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
      youtubeId: 'isN_Y9ULtXY',
    },
    {
      title: "Marvel's Spider-Man: Miles Morales",
      genre: 'Action-Adventure',
      year: 2020,
      developer: 'Insomniac Games',
      players: 'Single Player',
      description:
        "Experience the rise of Miles Morales as he masters explosive new powers and becomes his own Spider-Man, caught between a high-tech criminal army and a brilliant energy corporation in a snowy New York.",
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1817190/library_600x900.jpg',
      youtubeId: 'U-1cn1yOKYc',
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

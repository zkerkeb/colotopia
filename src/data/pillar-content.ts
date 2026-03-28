import type { Category, Locale } from '../lib/i18n';

export interface PillarFaq {
  question: string;
  answer: string;
}

export interface PillarData {
  intro: string;
  ageRange: string;
  benefits: string[];
  tips: string[];
  faq: PillarFaq[];
  relatedCategories: Category[];
}

type PillarRecord = Record<Category, Record<Locale, PillarData>>;

const pillarContent: Partial<PillarRecord> = {
  animaux: {
    fr: {
      intro: "Les coloriages d'animaux sont une activité incontournable pour les enfants de tous âges. Notre collection comprend des dizaines d'illustrations originales allant des animaux de la savane aux animaux domestiques, en passant par les créatures des forêts et des océans. Chaque coloriage est dessiné avec des contours nets et des formes adaptées aux petites mains, permettant aux enfants de développer leur créativité tout en découvrant le monde animal. Lions majestueux, éléphants adorables, lapins câlins, pandas joueurs — téléchargez et imprimez gratuitement tous nos coloriages animaux au format A4.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Apprentissage des espèces animales et de leurs habitats",
        "Développement de la motricité fine et de la coordination",
        "Stimulation de la créativité et du sens des couleurs",
        "Activité calme qui favorise la concentration",
      ],
      tips: [
        "Commencez par les contours avant de remplir les grandes surfaces",
        "Utilisez des couleurs réalistes ou laissez libre cours à l'imagination",
        "Proposez des crayons de couleur pour les détails et des feutres pour les grandes zones",
      ],
      faq: [
        {
          question: "À partir de quel âge peut-on colorier des animaux ?",
          answer: "Dès 3 ans, les enfants peuvent colorier des dessins d'animaux aux contours simples. Nos coloriages sont adaptés avec des traits épais pour les plus petits et des détails plus fins pour les enfants de 6 ans et plus.",
        },
        {
          question: "Comment imprimer les coloriages animaux ?",
          answer: "Cliquez sur le coloriage de votre choix, puis utilisez le bouton « Télécharger le PDF ». Le fichier est au format A4, optimisé pour une impression nette sur n'importe quelle imprimante.",
        },
        {
          question: "Les coloriages animaux sont-ils vraiment gratuits ?",
          answer: "Oui, tous nos coloriages sont 100% gratuits. Vous pouvez les télécharger et les imprimer autant de fois que vous le souhaitez, sans inscription ni frais cachés.",
        },
      ],
      relatedCategories: ['animaux-marins', 'ferme', 'dinosaures', 'nature'],
    },
    en: {
      intro: "Animal coloring pages are an essential activity for children of all ages. Our collection features dozens of original illustrations ranging from savanna animals to pets, including forest and ocean creatures. Each coloring page is drawn with clean outlines and shapes suited for little hands, allowing children to develop their creativity while discovering the animal world. Majestic lions, adorable elephants, cuddly rabbits, playful pandas — download and print all our animal coloring pages for free in A4 format.",
      ageRange: "3 to 10 years",
      benefits: [
        "Learning about animal species and their habitats",
        "Developing fine motor skills and coordination",
        "Stimulating creativity and color sense",
        "A calm activity that promotes concentration",
      ],
      tips: [
        "Start with outlines before filling in large areas",
        "Use realistic colors or let imagination run free",
        "Offer colored pencils for details and markers for large areas",
      ],
      faq: [
        {
          question: "What age is appropriate for animal coloring pages?",
          answer: "From age 3, children can color animal drawings with simple outlines. Our pages feature thick lines for the youngest and finer details for children aged 6 and up.",
        },
        {
          question: "How do I print the animal coloring pages?",
          answer: "Click on your chosen coloring page, then use the 'Download PDF' button. The file is in A4 format, optimized for crisp printing on any printer.",
        },
        {
          question: "Are the animal coloring pages really free?",
          answer: "Yes, all our coloring pages are 100% free. You can download and print them as many times as you like, with no registration or hidden fees.",
        },
      ],
      relatedCategories: ['animaux-marins', 'ferme', 'dinosaures', 'nature'],
    },
  },
  'animaux-marins': {
    fr: {
      intro: "Plongez dans les profondeurs de l'océan avec nos coloriages animaux marins ! Dauphins joueurs, baleines majestueuses, hippocampes gracieux, pieuvres aux tentacules fascinants — notre collection invite les enfants à explorer la vie sous-marine. Chaque illustration capture la beauté des créatures océaniques avec des contours clairs et des formes amusantes. Parfait pour éveiller la curiosité des enfants sur la biodiversité marine tout en développant leur motricité fine.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Découverte des créatures marines et de l'écosystème océanique",
        "Sensibilisation à la protection des océans",
        "Développement de la patience et de la précision",
        "Activité éducative et ludique à la fois",
      ],
      tips: [
        "Utilisez différentes nuances de bleu pour l'eau et les animaux",
        "Ajoutez des bulles et des algues autour des animaux pour créer un décor",
        "Mélangez les couleurs pour obtenir des effets de profondeur",
      ],
      faq: [
        {
          question: "Quels animaux marins trouve-t-on dans la collection ?",
          answer: "Notre collection comprend des dauphins, baleines, requins, pieuvres, hippocampes, méduses, tortues de mer, étoiles de mer, crabes, homards et bien d'autres créatures des océans.",
        },
        {
          question: "Ces coloriages sont-ils adaptés aux tout-petits ?",
          answer: "Oui, nos dessins d'animaux marins ont des contours simples et épais, parfaitement adaptés aux enfants dès 3 ans. Les plus grands trouveront aussi des modèles plus détaillés.",
        },
        {
          question: "Peut-on utiliser ces coloriages en classe ?",
          answer: "Absolument ! Nos coloriages sont gratuits et peuvent être imprimés pour un usage en classe, en crèche ou en centre de loisirs. Ils complètent parfaitement un cours sur les océans.",
        },
      ],
      relatedCategories: ['animaux', 'nature', 'pirates', 'dinosaures'],
    },
    en: {
      intro: "Dive into the ocean depths with our sea animal coloring pages! Playful dolphins, majestic whales, graceful seahorses, fascinating octopuses — our collection invites children to explore underwater life. Each illustration captures the beauty of ocean creatures with clear outlines and fun shapes. Perfect for sparking children's curiosity about marine biodiversity while developing fine motor skills.",
      ageRange: "3 to 10 years",
      benefits: [
        "Discovering marine creatures and ocean ecosystems",
        "Raising awareness about ocean conservation",
        "Developing patience and precision",
        "An activity that is both educational and fun",
      ],
      tips: [
        "Use different shades of blue for water and animals",
        "Add bubbles and seaweed around animals to create a scene",
        "Mix colors to create depth effects",
      ],
      faq: [
        {
          question: "What sea animals are in the collection?",
          answer: "Our collection includes dolphins, whales, sharks, octopuses, seahorses, jellyfish, sea turtles, starfish, crabs, lobsters and many more ocean creatures.",
        },
        {
          question: "Are these coloring pages suitable for toddlers?",
          answer: "Yes, our sea animal drawings have simple, thick outlines perfectly suited for children from age 3. Older children will also find more detailed designs.",
        },
        {
          question: "Can these coloring pages be used in class?",
          answer: "Absolutely! Our coloring pages are free and can be printed for classroom, nursery, or activity center use. They pair perfectly with ocean-themed lessons.",
        },
      ],
      relatedCategories: ['animaux', 'nature', 'pirates', 'dinosaures'],
    },
  },
  ferme: {
    fr: {
      intro: "Bienvenue à la ferme ! Nos coloriages d'animaux de la ferme transportent les enfants dans l'univers champêtre avec des vaches tachetées, des moutons laineux, des cochons roses, des poules pondeuses et des canards sur la mare. Chaque dessin met en scène la vie rurale avec charme et simplicité. Ces coloriages sont parfaits pour les petits qui découvrent les animaux domestiques et pour les plus grands qui aiment les scènes de campagne.",
      ageRange: "2 à 8 ans",
      benefits: [
        "Reconnaissance des animaux domestiques et de la ferme",
        "Découverte de la vie rurale et de l'agriculture",
        "Développement du vocabulaire lié aux animaux",
        "Activité adaptée aux très jeunes enfants",
      ],
      tips: [
        "Nommez chaque animal en coloriant pour enrichir le vocabulaire",
        "Utilisez des couleurs réalistes : rose pour le cochon, blanc pour le mouton",
        "Combinez avec des histoires sur la vie à la ferme",
      ],
      faq: [
        {
          question: "À quel âge commencer les coloriages de ferme ?",
          answer: "Les coloriages de la ferme sont parfaits dès 2-3 ans grâce à leurs formes simples et reconnaissables. Les animaux de la ferme sont souvent les premiers que les enfants apprennent à identifier.",
        },
        {
          question: "Quels animaux de la ferme sont disponibles ?",
          answer: "Notre collection inclut vaches, moutons, cochons, poules, coqs, canards, chèvres, chevaux, ânes et bien d'autres animaux de la ferme.",
        },
        {
          question: "Ces coloriages sont-ils éducatifs ?",
          answer: "Oui ! En plus de développer la motricité fine, ces coloriages permettent aux enfants d'apprendre les noms des animaux, leurs cris et leur rôle à la ferme.",
        },
      ],
      relatedCategories: ['animaux', 'nature', 'vehicules', 'saisons'],
    },
    en: {
      intro: "Welcome to the farm! Our farm animal coloring pages transport children to the countryside with spotted cows, fluffy sheep, pink pigs, laying hens and ducks on the pond. Each drawing brings rural life to life with charm and simplicity. These coloring pages are perfect for little ones discovering farm animals and for older children who enjoy countryside scenes.",
      ageRange: "2 to 8 years",
      benefits: [
        "Recognizing domestic and farm animals",
        "Discovering rural life and farming",
        "Building animal-related vocabulary",
        "Activity suited for very young children",
      ],
      tips: [
        "Name each animal while coloring to build vocabulary",
        "Use realistic colors: pink for the pig, white for the sheep",
        "Combine with stories about farm life",
      ],
      faq: [
        {
          question: "What age can children start farm coloring pages?",
          answer: "Farm coloring pages are perfect from age 2-3 thanks to their simple, recognizable shapes. Farm animals are often the first ones children learn to identify.",
        },
        {
          question: "Which farm animals are available?",
          answer: "Our collection includes cows, sheep, pigs, chickens, roosters, ducks, goats, horses, donkeys and many more farm animals.",
        },
        {
          question: "Are these coloring pages educational?",
          answer: "Yes! Besides developing fine motor skills, these coloring pages help children learn animal names, their sounds and their role on the farm.",
        },
      ],
      relatedCategories: ['animaux', 'nature', 'vehicules', 'saisons'],
    },
  },
  vehicules: {
    fr: {
      intro: "Vrroum ! Notre collection de coloriages véhicules fait rêver tous les petits passionnés de machines. Voitures de course, camions de pompier, avions à réaction, trains à vapeur, bateaux à voile — chaque coloriage est dessiné avec précision pour capturer les détails de chaque véhicule. Des engins de chantier imposants aux vélos colorés, en passant par les fusées spatiales, il y en a pour tous les goûts. Imprimez gratuitement et laissez vos enfants donner vie à leurs véhicules préférés !",
      ageRange: "3 à 10 ans",
      benefits: [
        "Apprentissage des différents modes de transport",
        "Développement de l'observation des détails",
        "Stimulation de l'intérêt pour la mécanique et la technologie",
        "Renforcement de la coordination œil-main",
      ],
      tips: [
        "Encouragez les enfants à ajouter un décor : route, ciel, paysage",
        "Discutez du fonctionnement de chaque véhicule en coloriant",
        "Les feutres fonctionnent bien pour les carrosseries, les crayons pour les détails",
      ],
      faq: [
        {
          question: "Quels types de véhicules sont disponibles ?",
          answer: "Nous proposons des voitures, camions, motos, trains, avions, hélicoptères, bateaux, fusées, vélos, tracteurs, ambulances, camions de pompier et bien plus encore.",
        },
        {
          question: "Les coloriages de véhicules conviennent-ils aux filles ?",
          answer: "Bien sûr ! Les véhicules fascinent tous les enfants. Notre collection inclut des avions, bateaux et véhicules variés qui plaisent à tous.",
        },
        {
          question: "Peut-on imprimer plusieurs fois le même coloriage ?",
          answer: "Oui, vous pouvez imprimer chaque coloriage autant de fois que vous le souhaitez. C'est gratuit et sans limite !",
        },
      ],
      relatedCategories: ['espace', 'robots', 'metiers', 'super-heros'],
    },
    en: {
      intro: "Vroom! Our vehicle coloring pages collection is a dream come true for little machine enthusiasts. Race cars, fire trucks, jet planes, steam trains, sailboats — each coloring page is drawn with precision to capture the details of every vehicle. From massive construction equipment to colorful bicycles and space rockets, there's something for everyone. Print for free and let your children bring their favorite vehicles to life!",
      ageRange: "3 to 10 years",
      benefits: [
        "Learning about different modes of transportation",
        "Developing attention to detail",
        "Stimulating interest in mechanics and technology",
        "Strengthening hand-eye coordination",
      ],
      tips: [
        "Encourage children to add a background: road, sky, landscape",
        "Discuss how each vehicle works while coloring",
        "Markers work well for body panels, pencils for details",
      ],
      faq: [
        {
          question: "What types of vehicles are available?",
          answer: "We offer cars, trucks, motorcycles, trains, planes, helicopters, boats, rockets, bicycles, tractors, ambulances, fire trucks and much more.",
        },
        {
          question: "Are vehicle coloring pages suitable for girls?",
          answer: "Of course! Vehicles fascinate all children. Our collection includes planes, boats and varied vehicles that appeal to everyone.",
        },
        {
          question: "Can I print the same coloring page multiple times?",
          answer: "Yes, you can print each coloring page as many times as you like. It's free with no limits!",
        },
      ],
      relatedCategories: ['espace', 'robots', 'metiers', 'super-heros'],
    },
  },
  nature: {
    fr: {
      intro: "Découvrez la beauté de la nature à travers nos coloriages ! Fleurs épanouies, arbres majestueux, papillons colorés, champignons enchantés, paysages de montagne — notre collection nature invite les enfants à explorer le monde végétal et les merveilles de l'environnement. Chaque illustration capture la douceur et la diversité de la nature avec des contours adaptés à tous les niveaux. Une activité parfaite pour sensibiliser les enfants à l'écologie tout en s'amusant.",
      ageRange: "3 à 12 ans",
      benefits: [
        "Sensibilisation à l'environnement et à l'écologie",
        "Apprentissage des plantes, fleurs et arbres",
        "Développement du sens artistique et des couleurs",
        "Activité relaxante et méditative",
      ],
      tips: [
        "Observez de vraies plantes pour choisir des couleurs réalistes",
        "Mélangez les verts pour un effet naturel",
        "Ajoutez des insectes et des oiseaux pour animer la scène",
      ],
      faq: [
        {
          question: "Quels éléments de la nature trouve-t-on dans ces coloriages ?",
          answer: "Notre collection comprend des fleurs, arbres, feuilles, champignons, papillons, paysages de forêt, scènes de jardin, cascades et bien d'autres merveilles naturelles.",
        },
        {
          question: "Ces coloriages sont-ils adaptés à une activité de classe ?",
          answer: "Parfaitement ! Ils complètent idéalement un cours de sciences naturelles ou une sortie en forêt. Imprimez-les gratuitement pour toute la classe.",
        },
        {
          question: "Existe-t-il des coloriages nature pour les plus grands ?",
          answer: "Oui, certains de nos dessins nature comportent des détails fins qui conviendront aux enfants de 8-12 ans et même aux adultes qui recherchent un moment de détente.",
        },
      ],
      relatedCategories: ['animaux', 'ferme', 'saisons', 'paysages'],
    },
    en: {
      intro: "Discover the beauty of nature through our coloring pages! Blooming flowers, majestic trees, colorful butterflies, enchanted mushrooms, mountain landscapes — our nature collection invites children to explore the plant world and the wonders of the environment. Each illustration captures nature's gentleness and diversity with outlines suited for all skill levels. A perfect activity to raise environmental awareness while having fun.",
      ageRange: "3 to 12 years",
      benefits: [
        "Environmental and ecological awareness",
        "Learning about plants, flowers and trees",
        "Developing artistic sense and color skills",
        "A relaxing, meditative activity",
      ],
      tips: [
        "Observe real plants to choose realistic colors",
        "Mix different greens for a natural effect",
        "Add insects and birds to bring the scene to life",
      ],
      faq: [
        {
          question: "What nature elements are in these coloring pages?",
          answer: "Our collection includes flowers, trees, leaves, mushrooms, butterflies, forest landscapes, garden scenes, waterfalls and many more natural wonders.",
        },
        {
          question: "Are these coloring pages suitable for classroom use?",
          answer: "Perfectly! They complement a natural science class or a forest trip beautifully. Print them for free for the whole class.",
        },
        {
          question: "Are there nature coloring pages for older children?",
          answer: "Yes, some of our nature drawings have fine details suited for children aged 8-12 and even adults looking for a relaxing moment.",
        },
      ],
      relatedCategories: ['animaux', 'ferme', 'saisons', 'paysages'],
    },
  },
  alphabet: {
    fr: {
      intro: "Apprendre l'alphabet devient un jeu d'enfant avec nos coloriages ! Chaque lettre est illustrée avec un dessin attrayant qui aide les enfants à mémoriser les lettres tout en s'amusant. De A comme Avion à Z comme Zèbre, notre collection couvre l'ensemble de l'alphabet avec des illustrations éducatives et amusantes. Un outil parfait pour préparer l'apprentissage de la lecture à la maison ou en classe de maternelle.",
      ageRange: "3 à 6 ans",
      benefits: [
        "Apprentissage ludique des lettres de l'alphabet",
        "Préparation à la lecture et à l'écriture",
        "Association lettre-image pour une meilleure mémorisation",
        "Développement de la motricité fine avant l'écriture",
      ],
      tips: [
        "Coloriez une lettre par jour pour un apprentissage progressif",
        "Prononcez le son de chaque lettre en coloriant",
        "Affichez les lettres coloriées au mur pour créer une frise alphabet",
      ],
      faq: [
        {
          question: "À quel âge commencer les coloriages alphabet ?",
          answer: "Dès 3 ans en maternelle, les enfants peuvent commencer à colorier les lettres. C'est une excellente introduction à l'alphabet avant l'apprentissage formel de la lecture.",
        },
        {
          question: "Comment utiliser ces coloriages pour apprendre à lire ?",
          answer: "Chaque lettre est associée à une image (A = Avion). En coloriant, l'enfant associe la forme de la lettre à un mot et un son, facilitant la mémorisation.",
        },
        {
          question: "Les 26 lettres sont-elles disponibles ?",
          answer: "Oui, l'alphabet complet de A à Z est disponible avec des illustrations originales pour chaque lettre.",
        },
      ],
      relatedCategories: ['personnages', 'animaux', 'nature', 'contes'],
    },
    en: {
      intro: "Learning the alphabet becomes child's play with our coloring pages! Each letter is illustrated with an engaging drawing that helps children memorize letters while having fun. From A for Airplane to Z for Zebra, our collection covers the entire alphabet with educational and fun illustrations. A perfect tool for preparing reading skills at home or in preschool.",
      ageRange: "3 to 6 years",
      benefits: [
        "Fun way to learn the alphabet letters",
        "Preparing for reading and writing",
        "Letter-image association for better memorization",
        "Developing fine motor skills before writing",
      ],
      tips: [
        "Color one letter per day for progressive learning",
        "Pronounce each letter's sound while coloring",
        "Display colored letters on the wall to create an alphabet frieze",
      ],
      faq: [
        {
          question: "What age should children start alphabet coloring pages?",
          answer: "From age 3 in preschool, children can start coloring letters. It's an excellent introduction to the alphabet before formal reading instruction.",
        },
        {
          question: "How can these coloring pages help with learning to read?",
          answer: "Each letter is paired with an image (A = Airplane). While coloring, children associate the letter shape with a word and sound, making memorization easier.",
        },
        {
          question: "Are all 26 letters available?",
          answer: "Yes, the complete alphabet from A to Z is available with original illustrations for each letter.",
        },
      ],
      relatedCategories: ['personnages', 'animaux', 'nature', 'contes'],
    },
  },
  dinosaures: {
    fr: {
      intro: "Remontez le temps avec nos coloriages dinosaures ! T-Rex féroces, Tricératops cuirassés, Brachiosaures géants, Ptéranodons volants — notre collection transporte les enfants dans le monde fascinant de la préhistoire. Chaque dinosaure est dessiné avec des détails captivants tout en restant accessible aux jeunes coloristes. Les enfants adorent les dinosaures et ces coloriages sont l'occasion idéale de combiner passion et apprentissage.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Découverte de la paléontologie et de la préhistoire",
        "Apprentissage des noms et caractéristiques des dinosaures",
        "Stimulation de l'imagination et de la curiosité scientifique",
        "Développement de la patience sur des dessins détaillés",
      ],
      tips: [
        "Personne ne connaît la vraie couleur des dinosaures — toutes les couleurs sont permises !",
        "Dessinez un décor préhistorique : volcans, fougères, marécages",
        "Recherchez ensemble les caractéristiques de chaque espèce",
      ],
      faq: [
        {
          question: "Quels dinosaures sont disponibles dans la collection ?",
          answer: "Notre collection inclut les plus célèbres : T-Rex, Tricératops, Brachiosaure, Stégosaure, Vélociraptor, Ptéranodon, Diplodocus et bien d'autres espèces préhistoriques.",
        },
        {
          question: "De quelle couleur étaient les dinosaures ?",
          answer: "Personne ne le sait avec certitude ! C'est ce qui rend le coloriage de dinosaures si amusant : votre enfant peut laisser libre cours à son imagination et inventer ses propres couleurs.",
        },
        {
          question: "Ces coloriages conviennent-ils aux enfants passionnés de dinosaures ?",
          answer: "Absolument ! Chaque coloriage est accompagné du nom de l'espèce. C'est une façon ludique d'approfondir leur passion tout en pratiquant une activité créative.",
        },
      ],
      relatedCategories: ['animaux', 'espace', 'nature', 'super-heros'],
    },
    en: {
      intro: "Travel back in time with our dinosaur coloring pages! Fierce T-Rex, armored Triceratops, giant Brachiosaurus, flying Pteranodons — our collection transports children into the fascinating world of prehistory. Each dinosaur is drawn with captivating details while remaining accessible to young artists. Children love dinosaurs and these coloring pages are the perfect opportunity to combine passion and learning.",
      ageRange: "4 to 12 years",
      benefits: [
        "Discovering paleontology and prehistory",
        "Learning dinosaur names and characteristics",
        "Stimulating imagination and scientific curiosity",
        "Developing patience on detailed drawings",
      ],
      tips: [
        "Nobody knows the real color of dinosaurs — all colors are allowed!",
        "Draw a prehistoric background: volcanoes, ferns, swamps",
        "Research each species' characteristics together",
      ],
      faq: [
        {
          question: "Which dinosaurs are in the collection?",
          answer: "Our collection includes the most famous: T-Rex, Triceratops, Brachiosaurus, Stegosaurus, Velociraptor, Pteranodon, Diplodocus and many more prehistoric species.",
        },
        {
          question: "What color were dinosaurs?",
          answer: "Nobody knows for certain! That's what makes coloring dinosaurs so fun: your child can let their imagination run wild and create their own colors.",
        },
        {
          question: "Are these coloring pages suitable for dinosaur-obsessed kids?",
          answer: "Absolutely! Each coloring page features the species name. It's a fun way to deepen their passion while practicing a creative activity.",
        },
      ],
      relatedCategories: ['animaux', 'espace', 'nature', 'super-heros'],
    },
  },
  'super-heros': {
    fr: {
      intro: "Enfilez votre cape et préparez vos crayons ! Nos coloriages super-héros permettent aux enfants d'imaginer leurs propres héros et héroïnes dotés de pouvoirs extraordinaires. Des personnages courageux qui volent dans le ciel, soulèvent des voitures ou lancent des rayons d'énergie — chaque coloriage est une invitation à l'aventure. Nos illustrations originales mettent en scène des super-héros variés et inclusifs qui inspirent bravoure et créativité.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Stimulation de l'imagination et de la créativité narrative",
        "Développement de valeurs positives : courage, entraide, justice",
        "Expression des émotions à travers les personnages",
        "Activité idéale pour les jeux de rôle créatifs",
      ],
      tips: [
        "Inventez un nom et une histoire pour chaque super-héros",
        "Utilisez des couleurs vives pour les costumes",
        "Ajoutez des effets spéciaux : éclairs, flammes, étoiles",
      ],
      faq: [
        {
          question: "Vos super-héros sont-ils des personnages originaux ?",
          answer: "Oui, tous nos super-héros sont des créations originales Colotopia. Ce ne sont pas des personnages sous licence, ce qui permet aux enfants de leur inventer des noms et des histoires uniques.",
        },
        {
          question: "Y a-t-il des super-héroïnes dans la collection ?",
          answer: "Bien sûr ! Notre collection est inclusive avec autant de super-héroïnes que de super-héros, représentant la diversité et montrant que tout le monde peut être un héros.",
        },
        {
          question: "Ces coloriages conviennent-ils pour un anniversaire ?",
          answer: "Parfaitement ! Les coloriages super-héros sont une activité idéale pour un anniversaire : imprimez-en plusieurs et laissez les enfants créer leur propre héros.",
        },
      ],
      relatedCategories: ['personnages', 'espace', 'robots', 'contes'],
    },
    en: {
      intro: "Put on your cape and grab your crayons! Our superhero coloring pages let children imagine their own heroes and heroines with extraordinary powers. Brave characters who fly through the sky, lift cars, or shoot energy beams — each coloring page is an invitation to adventure. Our original illustrations feature diverse and inclusive superheroes who inspire bravery and creativity.",
      ageRange: "4 to 12 years",
      benefits: [
        "Stimulating imagination and narrative creativity",
        "Developing positive values: courage, teamwork, justice",
        "Expressing emotions through characters",
        "Great activity for creative role-playing",
      ],
      tips: [
        "Invent a name and story for each superhero",
        "Use bright colors for costumes",
        "Add special effects: lightning, flames, stars",
      ],
      faq: [
        {
          question: "Are your superheroes original characters?",
          answer: "Yes, all our superheroes are original Colotopia creations. They are not licensed characters, allowing children to invent unique names and stories for them.",
        },
        {
          question: "Are there female superheroes in the collection?",
          answer: "Absolutely! Our collection is inclusive with as many superheroines as superheroes, representing diversity and showing that everyone can be a hero.",
        },
        {
          question: "Are these coloring pages suitable for birthday parties?",
          answer: "Perfectly! Superhero coloring pages are an ideal birthday party activity: print several and let children create their own hero.",
        },
      ],
      relatedCategories: ['personnages', 'espace', 'robots', 'contes'],
    },
  },
  espace: {
    fr: {
      intro: "3, 2, 1... décollage ! Nos coloriages espace emmènent les enfants dans un voyage intergalactique extraordinaire. Fusées flamboyantes, astronautes intrépides, planètes colorées, étoiles scintillantes, stations spatiales — chaque illustration est une fenêtre ouverte sur l'univers. Parfait pour les petits curieux qui rêvent de voyager dans les étoiles et d'explorer les mystères du cosmos.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Découverte du système solaire et de l'astronomie",
        "Stimulation de la curiosité scientifique",
        "Développement de l'imagination et des rêves d'exploration",
        "Apprentissage des planètes et des phénomènes spatiaux",
      ],
      tips: [
        "Utilisez un fond noir ou bleu foncé pour simuler l'espace",
        "Ajoutez des étoiles avec des points blancs ou jaunes",
        "Recherchez les vraies couleurs des planètes pour un coloriage réaliste",
      ],
      faq: [
        {
          question: "Quels éléments spatiaux sont disponibles ?",
          answer: "Notre collection comprend des fusées, astronautes, planètes du système solaire, étoiles, satellites, stations spatiales, aliens amicaux et scènes d'exploration lunaire.",
        },
        {
          question: "Ces coloriages sont-ils éducatifs ?",
          answer: "Oui ! Ils peuvent accompagner l'apprentissage du système solaire. Chaque planète peut être coloriée avec ses vraies couleurs tout en apprenant son nom et ses caractéristiques.",
        },
        {
          question: "Y a-t-il des astronautes filles dans la collection ?",
          answer: "Oui, notre collection inclut des astronautes garçons et filles, reflétant la diversité des explorateurs de l'espace.",
        },
      ],
      relatedCategories: ['robots', 'vehicules', 'super-heros', 'dinosaures'],
    },
    en: {
      intro: "3, 2, 1... liftoff! Our space coloring pages take children on an extraordinary intergalactic journey. Blazing rockets, intrepid astronauts, colorful planets, twinkling stars, space stations — each illustration is an open window to the universe. Perfect for curious little ones who dream of traveling through the stars and exploring the mysteries of the cosmos.",
      ageRange: "4 to 12 years",
      benefits: [
        "Discovering the solar system and astronomy",
        "Stimulating scientific curiosity",
        "Developing imagination and dreams of exploration",
        "Learning about planets and space phenomena",
      ],
      tips: [
        "Use a black or dark blue background to simulate space",
        "Add stars with white or yellow dots",
        "Research real planet colors for realistic coloring",
      ],
      faq: [
        {
          question: "What space elements are available?",
          answer: "Our collection includes rockets, astronauts, solar system planets, stars, satellites, space stations, friendly aliens, and lunar exploration scenes.",
        },
        {
          question: "Are these coloring pages educational?",
          answer: "Yes! They can accompany solar system learning. Each planet can be colored with its real colors while learning its name and characteristics.",
        },
        {
          question: "Are there female astronauts in the collection?",
          answer: "Yes, our collection includes both male and female astronauts, reflecting the diversity of space explorers.",
        },
      ],
      relatedCategories: ['robots', 'vehicules', 'super-heros', 'dinosaures'],
    },
  },
  'princesses-chevaliers': {
    fr: {
      intro: "Il était une fois... nos coloriages princesses et chevaliers transportent les enfants dans un monde féerique de châteaux, de couronnes et d'aventures médiévales ! Princesses élégantes, chevaliers courageux, dragons majestueux, châteaux enchantés — chaque illustration invite à créer son propre conte de fées. Une collection qui fait rêver les enfants et stimule leur imagination narrative.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Stimulation de l'imagination et du storytelling",
        "Découverte de l'univers médiéval et féerique",
        "Développement de la créativité vestimentaire et décorative",
        "Activité parfaite pour inventer des histoires",
      ],
      tips: [
        "Inventez une histoire pour chaque personnage en coloriant",
        "Utilisez des paillettes ou des crayons métalliques pour les couronnes",
        "Mélangez les rôles : une princesse peut aussi être chevalier !",
      ],
      faq: [
        {
          question: "Y a-t-il des princesses guerrières dans la collection ?",
          answer: "Oui ! Notre collection propose des princesses variées : certaines portent de belles robes, d'autres des armures. Les chevaliers aussi sont diversifiés pour que chaque enfant s'y retrouve.",
        },
        {
          question: "Ces coloriages plaisent-ils autant aux garçons qu'aux filles ?",
          answer: "Absolument ! Les chevaliers et les dragons séduisent tous les enfants, tout comme les princesses et les châteaux. C'est un univers qui fait rêver tout le monde.",
        },
        {
          question: "Peut-on utiliser ces coloriages pour un anniversaire médiéval ?",
          answer: "C'est l'idée parfaite ! Imprimez des coloriages de chevaliers, princesses, dragons et châteaux pour occuper les invités avec une activité créative sur le thème.",
        },
      ],
      relatedCategories: ['contes', 'personnages', 'super-heros', 'drole'],
    },
    en: {
      intro: "Once upon a time... our princess and knight coloring pages transport children to a magical world of castles, crowns and medieval adventures! Elegant princesses, brave knights, majestic dragons, enchanted castles — each illustration invites children to create their own fairy tale. A collection that makes children dream and stimulates their narrative imagination.",
      ageRange: "3 to 10 years",
      benefits: [
        "Stimulating imagination and storytelling",
        "Discovering medieval and fairy tale worlds",
        "Developing creativity in costume and decoration design",
        "Perfect activity for inventing stories",
      ],
      tips: [
        "Invent a story for each character while coloring",
        "Use glitter or metallic pencils for crowns",
        "Mix roles: a princess can be a knight too!",
      ],
      faq: [
        {
          question: "Are there warrior princesses in the collection?",
          answer: "Yes! Our collection features diverse princesses: some wear beautiful gowns, others wear armor. Knights are also varied so every child can find their favorite.",
        },
        {
          question: "Do both boys and girls enjoy these coloring pages?",
          answer: "Absolutely! Knights and dragons appeal to all children, just like princesses and castles. It's a world that inspires everyone.",
        },
        {
          question: "Can these be used for a medieval-themed birthday?",
          answer: "It's the perfect idea! Print knight, princess, dragon and castle coloring pages to keep guests busy with a creative themed activity.",
        },
      ],
      relatedCategories: ['contes', 'personnages', 'super-heros', 'drole'],
    },
  },
  metiers: {
    fr: {
      intro: "Qu'est-ce que tu veux faire quand tu seras grand ? Nos coloriages métiers présentent une grande variété de professions pour inspirer les enfants. Pompière courageuse, astronaute aventurière, médecin attentionné, scientifique curieuse, pilote intrépide — chaque coloriage met en scène un métier avec ses outils et son environnement. Une façon ludique de faire découvrir le monde du travail aux enfants.",
      ageRange: "4 à 10 ans",
      benefits: [
        "Découverte des différentes professions",
        "Développement des aspirations et des rêves",
        "Représentation inclusive et diversifiée des métiers",
        "Apprentissage du vocabulaire lié aux professions",
      ],
      tips: [
        "Discutez de chaque métier et de ce qu'il implique",
        "Demandez à l'enfant quel métier l'intéresse et pourquoi",
        "Coloriez les uniformes avec les bonnes couleurs pour chaque profession",
      ],
      faq: [
        {
          question: "Quels métiers sont représentés dans la collection ?",
          answer: "Notre collection inclut pompier, médecin, astronaute, scientifique, pilote, mécanicien, artiste, photographe, ingénieur, chirurgien, avocat et bien d'autres professions.",
        },
        {
          question: "La collection est-elle inclusive ?",
          answer: "Oui ! Nous représentons chaque métier avec des personnages masculins et féminins, de différentes origines, pour montrer que tous les métiers sont accessibles à tous.",
        },
        {
          question: "Ces coloriages sont-ils adaptés pour la classe ?",
          answer: "Parfaitement ! Ils sont idéaux pour accompagner une leçon sur les métiers ou une semaine des professions à l'école.",
        },
      ],
      relatedCategories: ['vehicules', 'super-heros', 'espace', 'sport'],
    },
    en: {
      intro: "What do you want to be when you grow up? Our jobs coloring pages present a wide variety of professions to inspire children. Brave firefighter, adventurous astronaut, caring doctor, curious scientist, intrepid pilot — each coloring page showcases a profession with its tools and environment. A fun way to introduce children to the world of work.",
      ageRange: "4 to 10 years",
      benefits: [
        "Discovering different professions",
        "Developing aspirations and dreams",
        "Inclusive and diverse representation of jobs",
        "Learning profession-related vocabulary",
      ],
      tips: [
        "Discuss each profession and what it involves",
        "Ask the child which job interests them and why",
        "Color uniforms with the right colors for each profession",
      ],
      faq: [
        {
          question: "What jobs are represented in the collection?",
          answer: "Our collection includes firefighter, doctor, astronaut, scientist, pilot, mechanic, artist, photographer, engineer, surgeon, lawyer and many more professions.",
        },
        {
          question: "Is the collection inclusive?",
          answer: "Yes! We represent each profession with male and female characters of different backgrounds, showing that all jobs are accessible to everyone.",
        },
        {
          question: "Are these coloring pages suitable for the classroom?",
          answer: "Perfectly! They are ideal for a lesson about professions or a career week at school.",
        },
      ],
      relatedCategories: ['vehicules', 'super-heros', 'espace', 'sport'],
    },
  },
  sport: {
    fr: {
      intro: "En avant les champions ! Nos coloriages sport mettent en scène toutes les disciplines préférées des enfants. Football, basketball, natation, gymnastique, tennis, skateboard — chaque illustration capture l'énergie et le mouvement des athlètes. Parfait pour les enfants sportifs qui veulent combiner leur passion du sport avec une activité créative et relaxante.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Découverte des différents sports et disciplines",
        "Promotion de l'activité physique et d'un mode de vie sain",
        "Apprentissage des valeurs sportives : effort, fair-play, persévérance",
        "Activité complémentaire au sport pour les jours de pluie",
      ],
      tips: [
        "Coloriez les maillots aux couleurs de l'équipe préférée",
        "Ajoutez un décor : terrain, public, arbitre",
        "Discutez des règles de chaque sport en coloriant",
      ],
      faq: [
        {
          question: "Quels sports sont disponibles en coloriages ?",
          answer: "Football, basketball, tennis, natation, gymnastique, skateboard, cyclisme, athlétisme, arts martiaux et bien d'autres disciplines sont représentés.",
        },
        {
          question: "Y a-t-il des sportives dans la collection ?",
          answer: "Oui ! Notre collection représente des athlètes garçons et filles dans chaque discipline, pour montrer que le sport est pour tous.",
        },
        {
          question: "Ces coloriages peuvent-ils motiver un enfant à faire du sport ?",
          answer: "Tout à fait ! Colorier un sport peut éveiller l'intérêt de l'enfant et l'encourager à essayer une nouvelle discipline.",
        },
      ],
      relatedCategories: ['metiers', 'super-heros', 'vehicules', 'personnages'],
    },
    en: {
      intro: "Go champions! Our sports coloring pages showcase all children's favorite disciplines. Football, basketball, swimming, gymnastics, tennis, skateboarding — each illustration captures the energy and movement of athletes. Perfect for sporty kids who want to combine their love of sports with a creative and relaxing activity.",
      ageRange: "4 to 12 years",
      benefits: [
        "Discovering different sports and disciplines",
        "Promoting physical activity and a healthy lifestyle",
        "Learning sports values: effort, fair play, perseverance",
        "A complementary activity to sports for rainy days",
      ],
      tips: [
        "Color jerseys in your favorite team's colors",
        "Add a background: field, crowd, referee",
        "Discuss each sport's rules while coloring",
      ],
      faq: [
        {
          question: "What sports coloring pages are available?",
          answer: "Football, basketball, tennis, swimming, gymnastics, skateboarding, cycling, athletics, martial arts and many other sports are represented.",
        },
        {
          question: "Are there female athletes in the collection?",
          answer: "Yes! Our collection represents both male and female athletes in every discipline, showing that sports are for everyone.",
        },
        {
          question: "Can these coloring pages motivate a child to try a sport?",
          answer: "Absolutely! Coloring a sport can spark a child's interest and encourage them to try a new discipline.",
        },
      ],
      relatedCategories: ['metiers', 'super-heros', 'vehicules', 'personnages'],
    },
  },
  saisons: {
    fr: {
      intro: "Printemps fleuri, été ensoleillé, automne doré, hiver enneigé — nos coloriages saisons célèbrent la beauté de chaque période de l'année. Les enfants peuvent explorer les paysages changeants, les activités saisonnières et les merveilles de la nature au fil des mois. Bonhomme de neige en hiver, château de sable en été, feuilles d'automne, fleurs de printemps — une collection qui accompagne les enfants toute l'année.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Apprentissage du cycle des saisons",
        "Compréhension des phénomènes naturels saisonniers",
        "Développement du vocabulaire lié à la météo et aux saisons",
        "Activité adaptée à chaque période de l'année",
      ],
      tips: [
        "Coloriez les dessins en fonction de la saison actuelle",
        "Utilisez des palettes de couleurs saisonnières : pastels au printemps, chauds en automne",
        "Comparez les dessins de chaque saison pour observer les différences",
      ],
      faq: [
        {
          question: "Les quatre saisons sont-elles représentées ?",
          answer: "Oui ! Printemps, été, automne et hiver sont tous représentés avec plusieurs dessins pour chaque saison, couvrant la nature, les activités et les paysages saisonniers.",
        },
        {
          question: "Comment utiliser ces coloriages de façon éducative ?",
          answer: "Utilisez-les pour accompagner l'apprentissage des saisons : discutez des changements de la nature, de la météo et des activités propres à chaque saison pendant le coloriage.",
        },
        {
          question: "Y a-t-il des coloriages pour Noël et Halloween ?",
          answer: "Les scènes d'hiver incluent des éléments de fêtes. Pour des coloriages spécifiquement dédiés aux fêtes, consultez notre catégorie Fêtes.",
        },
      ],
      relatedCategories: ['nature', 'fetes', 'ferme', 'paysages'],
    },
    en: {
      intro: "Blooming spring, sunny summer, golden autumn, snowy winter — our seasons coloring pages celebrate the beauty of every time of year. Children can explore changing landscapes, seasonal activities, and nature's wonders throughout the months. Snowman in winter, sandcastle in summer, autumn leaves, spring flowers — a collection that accompanies children all year round.",
      ageRange: "3 to 10 years",
      benefits: [
        "Learning about the cycle of seasons",
        "Understanding seasonal natural phenomena",
        "Building weather and season-related vocabulary",
        "Activity suited to every time of year",
      ],
      tips: [
        "Color the drawings to match the current season",
        "Use seasonal color palettes: pastels in spring, warm tones in autumn",
        "Compare drawings from each season to observe differences",
      ],
      faq: [
        {
          question: "Are all four seasons represented?",
          answer: "Yes! Spring, summer, autumn and winter are all represented with multiple drawings for each season, covering nature, activities and seasonal landscapes.",
        },
        {
          question: "How can these coloring pages be used educationally?",
          answer: "Use them to accompany season learning: discuss changes in nature, weather, and activities specific to each season while coloring.",
        },
        {
          question: "Are there Christmas and Halloween coloring pages?",
          answer: "Winter scenes include holiday elements. For coloring pages specifically dedicated to holidays, check out our Holidays category.",
        },
      ],
      relatedCategories: ['nature', 'fetes', 'ferme', 'paysages'],
    },
  },
  fetes: {
    fr: {
      intro: "Célébrez toute l'année avec nos coloriages fêtes ! Noël magique, Halloween effrayant, Pâques joyeux, carnaval coloré — chaque fête a ses propres coloriages thématiques. Sapins décorés, citrouilles grimaçantes, œufs de Pâques, masques de carnaval — une collection festive qui accompagne les enfants lors de chaque célébration. Parfait pour décorer la maison ou préparer les festivités.",
      ageRange: "3 à 12 ans",
      benefits: [
        "Découverte des traditions et des fêtes culturelles",
        "Préparation festive et décoration",
        "Activité de groupe pour les événements familiaux",
        "Création de souvenirs personnalisés pour chaque fête",
      ],
      tips: [
        "Imprimez les coloriages en avance pour préparer la fête",
        "Utilisez les coloriages comme décorations une fois terminés",
        "Organisez un atelier coloriage lors des fêtes de famille",
      ],
      faq: [
        {
          question: "Quelles fêtes sont couvertes par la collection ?",
          answer: "Noël, Halloween, Pâques, la Saint-Valentin, le carnaval, la fête des mères, la fête des pères et d'autres célébrations tout au long de l'année.",
        },
        {
          question: "Les coloriages de Noël sont-ils disponibles toute l'année ?",
          answer: "Oui, tous nos coloriages sont disponibles en permanence. Vous pouvez les imprimer à tout moment, que ce soit pour préparer les fêtes en avance ou pour le plaisir.",
        },
        {
          question: "Peut-on utiliser les coloriages terminés comme décoration ?",
          answer: "Absolument ! Les coloriages de Noël, Pâques ou Halloween font de superbes décorations une fois terminés. Affichez-les ou découpez-les pour décorer la maison.",
        },
      ],
      relatedCategories: ['saisons', 'personnages', 'contes', 'drole'],
    },
    en: {
      intro: "Celebrate all year round with our holiday coloring pages! Magical Christmas, spooky Halloween, joyful Easter, colorful carnival — every holiday has its own themed coloring pages. Decorated trees, grinning pumpkins, Easter eggs, carnival masks — a festive collection that accompanies children through every celebration. Perfect for decorating the home or preparing for festivities.",
      ageRange: "3 to 12 years",
      benefits: [
        "Discovering traditions and cultural celebrations",
        "Festive preparation and decoration",
        "Group activity for family events",
        "Creating personalized keepsakes for each holiday",
      ],
      tips: [
        "Print coloring pages in advance to prepare for the holiday",
        "Use finished coloring pages as decorations",
        "Organize a coloring workshop during family gatherings",
      ],
      faq: [
        {
          question: "Which holidays are covered in the collection?",
          answer: "Christmas, Halloween, Easter, Valentine's Day, carnival, Mother's Day, Father's Day and other celebrations throughout the year.",
        },
        {
          question: "Are Christmas coloring pages available year-round?",
          answer: "Yes, all our coloring pages are available at all times. You can print them anytime, whether to prepare for holidays in advance or just for fun.",
        },
        {
          question: "Can finished coloring pages be used as decorations?",
          answer: "Absolutely! Christmas, Easter or Halloween coloring pages make wonderful decorations when finished. Display them or cut them out to decorate the home.",
        },
      ],
      relatedCategories: ['saisons', 'personnages', 'contes', 'drole'],
    },
  },
  personnages: {
    fr: {
      intro: "Des personnages attachants à colorier pour tous les goûts ! Notre collection de coloriages personnages propose des garçons et des filles dans toutes sortes de situations amusantes et quotidiennes. Enfants joueurs, bébés mignons, familles heureuses — chaque dessin raconte une petite histoire que l'enfant peut compléter avec ses couleurs. Une collection douce et bienveillante qui reflète la diversité et encourage l'expression créative.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Identification et empathie avec les personnages",
        "Développement de la narration et de l'imagination",
        "Représentation de la diversité et de l'inclusion",
        "Expression des émotions à travers le coloriage",
      ],
      tips: [
        "Demandez à l'enfant d'inventer un nom pour chaque personnage",
        "Utilisez des couleurs de peau variées pour refléter la diversité",
        "Encouragez l'enfant à raconter l'histoire du personnage",
      ],
      faq: [
        {
          question: "Les personnages sont-ils diversifiés ?",
          answer: "Oui ! Nos personnages représentent la diversité des origines, des styles et des situations. Chaque enfant peut se retrouver dans nos illustrations.",
        },
        {
          question: "Y a-t-il des personnages pour les très jeunes enfants ?",
          answer: "Oui, nous avons des dessins avec des contours très simples et des formes rondes adaptées aux enfants dès 3 ans.",
        },
        {
          question: "Ces personnages sont-ils liés à des dessins animés ?",
          answer: "Non, tous nos personnages sont des créations originales. Cela permet aux enfants de les adopter librement et de leur inventer leurs propres histoires.",
        },
      ],
      relatedCategories: ['contes', 'super-heros', 'metiers', 'drole'],
    },
    en: {
      intro: "Lovable characters to color for every taste! Our characters coloring page collection features boys and girls in all sorts of fun and everyday situations. Playful children, cute babies, happy families — each drawing tells a little story that children can complete with their colors. A gentle, inclusive collection that reflects diversity and encourages creative expression.",
      ageRange: "3 to 10 years",
      benefits: [
        "Identification and empathy with characters",
        "Developing narrative skills and imagination",
        "Representing diversity and inclusion",
        "Expressing emotions through coloring",
      ],
      tips: [
        "Ask the child to invent a name for each character",
        "Use varied skin tones to reflect diversity",
        "Encourage the child to tell the character's story",
      ],
      faq: [
        {
          question: "Are the characters diverse?",
          answer: "Yes! Our characters represent diverse backgrounds, styles and situations. Every child can see themselves in our illustrations.",
        },
        {
          question: "Are there characters for very young children?",
          answer: "Yes, we have drawings with very simple outlines and rounded shapes suited for children from age 3.",
        },
        {
          question: "Are these characters from cartoons?",
          answer: "No, all our characters are original creations. This lets children adopt them freely and invent their own stories.",
        },
      ],
      relatedCategories: ['contes', 'super-heros', 'metiers', 'drole'],
    },
  },
  contes: {
    fr: {
      intro: "Il était une fois... nos coloriages contes de fées font revivre les histoires magiques que les enfants adorent ! Fées étincelantes, sorcières bienveillantes, loups malicieux, maisons enchantées — chaque illustration plonge dans l'univers merveilleux des contes traditionnels et modernes. Une collection idéale pour accompagner la lecture d'histoires et stimuler l'imagination narrative des enfants.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Immersion dans l'univers des contes et de la littérature",
        "Stimulation de l'imagination et de la narration",
        "Complément idéal à la lecture d'histoires",
        "Découverte des archétypes et des valeurs morales",
      ],
      tips: [
        "Lisez l'histoire avant de colorier pour contextualiser",
        "Laissez l'enfant choisir ses propres couleurs pour les personnages",
        "Créez un livre de contes coloriés en reliant les pages",
      ],
      faq: [
        {
          question: "Quels contes sont représentés ?",
          answer: "Notre collection s'inspire librement des contes classiques avec des personnages originaux : fées, sorcières, dragons, princes et princesses, loups et personnages enchantés.",
        },
        {
          question: "Les dessins sont-ils effrayants pour les petits ?",
          answer: "Non ! Nos illustrations sont douces et adaptées aux enfants. Les sorcières sont gentilles, les loups sont malicieux mais pas effrayants. Tout est conçu pour amuser, pas pour faire peur.",
        },
        {
          question: "Peut-on utiliser ces coloriages avec un livre de contes ?",
          answer: "C'est l'idéal ! Lisez une histoire puis proposez le coloriage correspondant. L'enfant revit l'histoire en la coloriant.",
        },
      ],
      relatedCategories: ['princesses-chevaliers', 'personnages', 'fetes', 'drole'],
    },
    en: {
      intro: "Once upon a time... our fairy tale coloring pages bring to life the magical stories children love! Sparkling fairies, kind witches, mischievous wolves, enchanted houses — each illustration dives into the wonderful world of traditional and modern tales. An ideal collection to accompany storytelling and stimulate children's narrative imagination.",
      ageRange: "3 to 10 years",
      benefits: [
        "Immersion in fairy tales and literature",
        "Stimulating imagination and storytelling",
        "Perfect complement to story reading",
        "Discovering archetypes and moral values",
      ],
      tips: [
        "Read the story before coloring to set the context",
        "Let the child choose their own colors for characters",
        "Create a colored storybook by binding the pages together",
      ],
      faq: [
        {
          question: "Which fairy tales are represented?",
          answer: "Our collection draws freely from classic tales with original characters: fairies, witches, dragons, princes and princesses, wolves and enchanted characters.",
        },
        {
          question: "Are the drawings scary for young children?",
          answer: "Not at all! Our illustrations are gentle and child-friendly. Witches are kind, wolves are mischievous but not scary. Everything is designed to amuse, not frighten.",
        },
        {
          question: "Can these coloring pages be used with a storybook?",
          answer: "It's ideal! Read a story then offer the matching coloring page. The child relives the story by coloring it.",
        },
      ],
      relatedCategories: ['princesses-chevaliers', 'personnages', 'fetes', 'drole'],
    },
  },
  drole: {
    fr: {
      intro: "Préparez-vous à rire ! Nos coloriages drôles mettent en scène des situations hilarantes et des personnages loufoques qui feront sourire toute la famille. Chat pirate, hippopotame pompier, zèbre musicien, serpent cuisinier — notre collection multiplie les combinaisons absurdes et amusantes. Parfait pour les enfants qui aiment l'humour et les surprises visuelles.",
      ageRange: "3 à 12 ans",
      benefits: [
        "Développement du sens de l'humour et de la joie",
        "Stimulation de l'imagination avec des combinaisons inattendues",
        "Réduction du stress grâce au rire et à l'amusement",
        "Encouragement à la créativité décalée",
      ],
      tips: [
        "Utilisez des couleurs folles et inattendues",
        "Inventez une histoire drôle pour chaque personnage",
        "Ajoutez vos propres détails humoristiques au dessin",
      ],
      faq: [
        {
          question: "Qu'est-ce qui rend ces coloriages drôles ?",
          answer: "Nos coloriages drôles mélangent des animaux avec des métiers ou des situations inattendues : un chat déguisé en pirate, un ours qui surfe, un hippopotame pompier. Des combinaisons absurdes qui font rire les enfants !",
        },
        {
          question: "Ces coloriages sont-ils adaptés à tous les âges ?",
          answer: "Oui ! L'humour visuel de nos dessins fonctionne de 3 à 99 ans. Les plus petits rient de voir un animal dans une situation inattendue, les plus grands apprécient l'absurdité créative.",
        },
        {
          question: "Y a-t-il régulièrement de nouveaux coloriages drôles ?",
          answer: "Nous ajoutons régulièrement de nouvelles combinaisons hilarantes. Revenez souvent pour découvrir de nouveaux personnages décalés !",
        },
      ],
      relatedCategories: ['personnages', 'animaux', 'pirates', 'robots'],
    },
    en: {
      intro: "Get ready to laugh! Our funny coloring pages feature hilarious situations and wacky characters that will make the whole family smile. Pirate cat, firefighter hippo, musician zebra, chef snake — our collection multiplies absurd and amusing combinations. Perfect for children who love humor and visual surprises.",
      ageRange: "3 to 12 years",
      benefits: [
        "Developing a sense of humor and joy",
        "Stimulating imagination with unexpected combinations",
        "Reducing stress through laughter and fun",
        "Encouraging offbeat creativity",
      ],
      tips: [
        "Use crazy and unexpected colors",
        "Invent a funny story for each character",
        "Add your own humorous details to the drawing",
      ],
      faq: [
        {
          question: "What makes these coloring pages funny?",
          answer: "Our funny coloring pages mix animals with unexpected jobs or situations: a cat dressed as a pirate, a surfing bear, a firefighter hippo. Absurd combinations that make kids laugh!",
        },
        {
          question: "Are these coloring pages suitable for all ages?",
          answer: "Yes! The visual humor works from age 3 to 99. Little ones laugh at seeing an animal in an unexpected situation, older kids appreciate the creative absurdity.",
        },
        {
          question: "Are new funny coloring pages added regularly?",
          answer: "We regularly add new hilarious combinations. Come back often to discover new wacky characters!",
        },
      ],
      relatedCategories: ['personnages', 'animaux', 'pirates', 'robots'],
    },
  },
  musique: {
    fr: {
      intro: "La musique en couleurs ! Nos coloriages musique invitent les enfants à découvrir le monde des instruments et des mélodies. Guitares, pianos, batteries, violons, trompettes — chaque instrument est illustré de façon amusante et accessible. Des personnages musiciens animent la collection avec leur énergie et leur passion. Parfait pour les petits mélomanes et les futurs musiciens.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Découverte des instruments de musique",
        "Éveil musical et artistique combinés",
        "Développement du vocabulaire musical",
        "Activité créative complémentaire à l'apprentissage musical",
      ],
      tips: [
        "Écoutez la musique de chaque instrument pendant le coloriage",
        "Utilisez des couleurs vives pour exprimer l'énergie de la musique",
        "Associez chaque coloriage à l'écoute d'un morceau",
      ],
      faq: [
        {
          question: "Quels instruments de musique sont dans la collection ?",
          answer: "Guitare, piano, batterie, violon, trompette, flûte, saxophone, harpe, tambourin et bien d'autres instruments sont représentés dans notre collection.",
        },
        {
          question: "Ces coloriages peuvent-ils compléter des cours de musique ?",
          answer: "Oui ! Ils sont parfaits pour accompagner l'éveil musical : l'enfant colorie l'instrument qu'il apprend ou qu'il souhaite découvrir.",
        },
        {
          question: "Les dessins sont-ils réalistes ?",
          answer: "Nos illustrations sont stylisées et adaptées aux enfants tout en restant fidèles à la forme de chaque instrument. L'enfant peut ainsi reconnaître facilement les instruments.",
        },
      ],
      relatedCategories: ['personnages', 'fetes', 'drole', 'metiers'],
    },
    en: {
      intro: "Music in colors! Our music coloring pages invite children to discover the world of instruments and melodies. Guitars, pianos, drums, violins, trumpets — each instrument is illustrated in a fun and accessible way. Musical characters bring the collection to life with their energy and passion. Perfect for little music lovers and future musicians.",
      ageRange: "3 to 10 years",
      benefits: [
        "Discovering musical instruments",
        "Combining musical and artistic awakening",
        "Building musical vocabulary",
        "A creative activity complementing music learning",
      ],
      tips: [
        "Listen to each instrument's music while coloring",
        "Use bright colors to express the energy of music",
        "Pair each coloring page with listening to a piece",
      ],
      faq: [
        {
          question: "What musical instruments are in the collection?",
          answer: "Guitar, piano, drums, violin, trumpet, flute, saxophone, harp, tambourine and many more instruments are represented in our collection.",
        },
        {
          question: "Can these coloring pages complement music lessons?",
          answer: "Yes! They're perfect for accompanying musical awakening: the child colors the instrument they're learning or want to discover.",
        },
        {
          question: "Are the drawings realistic?",
          answer: "Our illustrations are stylized and child-friendly while remaining true to each instrument's shape. Children can easily recognize the instruments.",
        },
      ],
      relatedCategories: ['personnages', 'fetes', 'drole', 'metiers'],
    },
  },
  nourriture: {
    fr: {
      intro: "Miam miam ! Nos coloriages nourriture font saliver les petits artistes. Cupcakes gourmands, hamburgers géants, sushis mignons, crêpes dorées, légumes rigolos — chaque aliment est dessiné de façon amusante et appétissante. Ces coloriages sont parfaits pour parler nutrition avec les enfants tout en s'amusant. Une collection qui mélange gourmandise et créativité !",
      ageRange: "3 à 10 ans",
      benefits: [
        "Découverte des aliments et de la nutrition",
        "Discussion sur l'alimentation équilibrée de manière ludique",
        "Développement du vocabulaire alimentaire",
        "Activité amusante autour de la cuisine et de la gourmandise",
      ],
      tips: [
        "Utilisez des couleurs réalistes pour les aliments",
        "Parlez de l'origine de chaque aliment et de ses bienfaits",
        "Créez un menu imaginaire avec les coloriages terminés",
      ],
      faq: [
        {
          question: "Quels aliments sont disponibles ?",
          answer: "Cupcakes, hamburgers, sushis, crêpes, légumes, fruits, pizzas, glaces et bien d'autres aliments appétissants sont dans notre collection.",
        },
        {
          question: "Ces coloriages aident-ils à parler de nutrition ?",
          answer: "Oui ! C'est une façon ludique d'aborder les groupes alimentaires, l'importance des légumes et les bonnes habitudes alimentaires avec les enfants.",
        },
        {
          question: "Les dessins de nourriture sont-ils kawaii ?",
          answer: "Oui, plusieurs de nos dessins d'aliments ont un style kawaii (mignon japonais) avec des petits yeux et des sourires, ce qui les rend encore plus amusants à colorier.",
        },
      ],
      relatedCategories: ['drole', 'personnages', 'fetes', 'metiers'],
    },
    en: {
      intro: "Yum yum! Our food coloring pages will make little artists drool. Delicious cupcakes, giant hamburgers, cute sushi, golden crepes, funny vegetables — each food item is drawn in a fun and appetizing way. These coloring pages are perfect for talking about nutrition with children while having fun. A collection that mixes indulgence and creativity!",
      ageRange: "3 to 10 years",
      benefits: [
        "Discovering foods and nutrition",
        "Discussing balanced eating in a fun way",
        "Building food-related vocabulary",
        "A fun activity around cooking and food",
      ],
      tips: [
        "Use realistic colors for the food items",
        "Talk about each food's origin and benefits",
        "Create an imaginary menu with finished coloring pages",
      ],
      faq: [
        {
          question: "What food items are available?",
          answer: "Cupcakes, hamburgers, sushi, crepes, vegetables, fruits, pizzas, ice cream and many more appetizing foods are in our collection.",
        },
        {
          question: "Do these coloring pages help talk about nutrition?",
          answer: "Yes! It's a fun way to discuss food groups, the importance of vegetables and good eating habits with children.",
        },
        {
          question: "Are the food drawings kawaii-style?",
          answer: "Yes, several of our food drawings have a kawaii (cute Japanese) style with little eyes and smiles, making them even more fun to color.",
        },
      ],
      relatedCategories: ['drole', 'personnages', 'fetes', 'metiers'],
    },
  },
  pirates: {
    fr: {
      intro: "À l'abordage ! Nos coloriages pirates embarquent les enfants dans des aventures maritimes palpitantes. Bateaux pirates, trésors cachés, perroquets malicieux, cartes au trésor, îles mystérieuses — chaque illustration est une invitation au voyage et à l'aventure. Les enfants adorent l'univers des pirates et ces coloriages sont parfaits pour nourrir leur imaginaire d'exploration et de découverte.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Stimulation de l'imagination et du goût de l'aventure",
        "Développement de la narration et du jeu de rôle",
        "Découverte de l'univers maritime et de la navigation",
        "Activité idéale pour les fêtes d'anniversaire sur le thème pirate",
      ],
      tips: [
        "Créez une carte au trésor en coloriant et en ajoutant des indices",
        "Utilisez des couleurs sombres pour le bateau et vives pour le perroquet",
        "Inventez un nom de pirate pour chaque personnage",
      ],
      faq: [
        {
          question: "Quels éléments pirates sont dans la collection ?",
          answer: "Bateaux pirates, trésors, coffres, cartes au trésor, perroquets, ancres, épées, chapeaux de pirate, bouteilles à la mer, canons et bien d'autres accessoires de pirate.",
        },
        {
          question: "Ces coloriages conviennent-ils pour un anniversaire pirate ?",
          answer: "Parfaitement ! Imprimez plusieurs modèles pour une activité coloriage lors d'un anniversaire sur le thème des pirates. Les enfants adorent !",
        },
        {
          question: "Les dessins sont-ils effrayants ?",
          answer: "Non, nos pirates sont amusants et sympathiques. Pas de scènes violentes — juste de l'aventure, des trésors et du fun adapté aux enfants.",
        },
      ],
      relatedCategories: ['animaux-marins', 'vehicules', 'drole', 'personnages'],
    },
    en: {
      intro: "All aboard! Our pirate coloring pages take children on thrilling maritime adventures. Pirate ships, hidden treasures, mischievous parrots, treasure maps, mysterious islands — each illustration is an invitation to voyage and adventure. Children love the pirate universe and these coloring pages are perfect for fueling their imagination of exploration and discovery.",
      ageRange: "4 to 12 years",
      benefits: [
        "Stimulating imagination and a taste for adventure",
        "Developing narrative and role-playing skills",
        "Discovering the maritime world and navigation",
        "Ideal activity for pirate-themed birthday parties",
      ],
      tips: [
        "Create a treasure map by coloring and adding clues",
        "Use dark colors for the ship and bright ones for the parrot",
        "Invent a pirate name for each character",
      ],
      faq: [
        {
          question: "What pirate elements are in the collection?",
          answer: "Pirate ships, treasures, chests, treasure maps, parrots, anchors, swords, pirate hats, messages in bottles, cannons and many more pirate accessories.",
        },
        {
          question: "Are these coloring pages good for a pirate birthday party?",
          answer: "Perfectly! Print several designs for a coloring activity at a pirate-themed birthday party. Kids love it!",
        },
        {
          question: "Are the drawings scary?",
          answer: "No, our pirates are fun and friendly. No violent scenes — just adventure, treasure and kid-friendly fun.",
        },
      ],
      relatedCategories: ['animaux-marins', 'vehicules', 'drole', 'personnages'],
    },
  },
  robots: {
    fr: {
      intro: "Bip boop ! Nos coloriages robots transportent les enfants dans un univers futuriste rempli de machines amicales et de technologie amusante. Robots danseurs, robots cuisiniers, robots surfeurs — chaque illustration donne vie à des automates attachants avec leurs personnalités uniques. Parfait pour les enfants fascinés par la technologie et l'intelligence artificielle, tout en restant ludique et accessible.",
      ageRange: "4 à 12 ans",
      benefits: [
        "Éveil à la technologie et à la robotique",
        "Stimulation de l'imagination futuriste",
        "Développement de l'intérêt pour les sciences",
        "Combinaison créativité et technologie",
      ],
      tips: [
        "Utilisez des couleurs métalliques : gris, argent, bleu acier",
        "Ajoutez des lumières et des boutons colorés sur les robots",
        "Inventez une fonction spéciale pour chaque robot",
      ],
      faq: [
        {
          question: "Quels types de robots sont dans la collection ?",
          answer: "Des robots de toutes sortes : robots humanoïdes, robots animaux, robots avec des personnalités amusantes (surfeur, cuisinier, danseur). Chacun a son caractère unique.",
        },
        {
          question: "Ces coloriages sont-ils adaptés aux fans de technologie ?",
          answer: "Absolument ! Les robots sont dessinés avec des détails techniques amusants (boutons, engrenages, antennes) qui plairont aux enfants curieux de technologie.",
        },
        {
          question: "Les robots sont-ils effrayants ?",
          answer: "Pas du tout ! Nos robots sont amicaux, souriants et amusants. Ils sont conçus pour être attachants et rigolos, pas intimidants.",
        },
      ],
      relatedCategories: ['espace', 'vehicules', 'super-heros', 'drole'],
    },
    en: {
      intro: "Beep boop! Our robot coloring pages transport children into a futuristic universe filled with friendly machines and fun technology. Dancing robots, cooking robots, surfing robots — each illustration brings lovable automatons to life with their unique personalities. Perfect for children fascinated by technology and artificial intelligence, while remaining fun and accessible.",
      ageRange: "4 to 12 years",
      benefits: [
        "Awakening interest in technology and robotics",
        "Stimulating futuristic imagination",
        "Developing interest in science",
        "Combining creativity and technology",
      ],
      tips: [
        "Use metallic colors: gray, silver, steel blue",
        "Add colorful lights and buttons on the robots",
        "Invent a special function for each robot",
      ],
      faq: [
        {
          question: "What types of robots are in the collection?",
          answer: "All sorts of robots: humanoid robots, animal robots, robots with fun personalities (surfer, chef, dancer). Each one has its unique character.",
        },
        {
          question: "Are these coloring pages suitable for tech fans?",
          answer: "Absolutely! The robots are drawn with fun technical details (buttons, gears, antennas) that will appeal to tech-curious children.",
        },
        {
          question: "Are the robots scary?",
          answer: "Not at all! Our robots are friendly, smiling and fun. They're designed to be lovable and silly, not intimidating.",
        },
      ],
      relatedCategories: ['espace', 'vehicules', 'super-heros', 'drole'],
    },
  },
  kawaii: {
    fr: {
      intro: "Kawaii (かわいい) signifie « mignon » en japonais, et nos coloriages kawaii capturent parfaitement cette esthétique douce et attachante. Grands yeux pétillants, joues roses, sourires irrésistibles : chaque personnage est conçu pour provoquer un « aww » instantané ! Fraises souriantes, chats aux yeux brillants, licornes rondelettes, dragons bébés — notre collection kawaii offre une variété infinie de sujets adorables pour les enfants qui aiment le mignon.",
      ageRange: "3 à 10 ans",
      benefits: [
        "Développement de la motricité fine avec des formes rondes accessibles",
        "Éveil à l'esthétique japonaise et à la culture kawaii",
        "Expression émotionnelle à travers des personnages expressifs",
        "Confiance créative grâce à des dessins simples et réussis",
      ],
      tips: [
        "Utilisez des couleurs pastel douces : rose pâle, lavande, menthe, pêche",
        "Laissez les yeux en blanc pour un effet brillant",
        "Ajoutez des petits cœurs et des étoiles autour des personnages",
      ],
      faq: [
        {
          question: "C'est quoi le style kawaii ?",
          answer: "Kawaii est un mot japonais qui signifie « mignon ». Le style kawaii se caractérise par des personnages aux grands yeux ronds, aux formes arrondies et aux expressions douces. Il est né au Japon dans les années 70 et s'est répandu dans le monde entier.",
        },
        {
          question: "Dès quel âge peut-on colorier les coloriages kawaii ?",
          answer: "Dès 3 ans ! Les formes rondes et les grands espaces à colorier sont parfaits pour les très jeunes enfants. Les détails des yeux et des joues restent simples et accessibles.",
        },
        {
          question: "Quels sont les sujets kawaii disponibles ?",
          answer: "Notre collection couvre une grande variété : animaux kawaii (chat, lapin, panda, renard), nourriture kawaii (fraise, glace, cupcake, pizza), objets kawaii (étoile, nuage, lune, soleil) et créatures fantastiques kawaii (licorne, dragon bébé).",
        },
      ],
      relatedCategories: ['drole', 'animaux', 'contes', 'princesses-chevaliers'],
    },
    en: {
      intro: "Kawaii (かわいい) means \"cute\" in Japanese, and our kawaii coloring pages perfectly capture this sweet and lovable aesthetic. Big sparkling eyes, rosy cheeks, irresistible smiles — every character is designed to provoke an instant \"aww\"! Smiling strawberries, bright-eyed cats, chubby unicorns, baby dragons — our kawaii collection offers endless adorable subjects for children who love all things cute.",
      ageRange: "3 to 10 years",
      benefits: [
        "Fine motor skill development with accessible rounded shapes",
        "Introduction to Japanese aesthetics and kawaii culture",
        "Emotional expression through expressive characters",
        "Creative confidence with simple, achievable drawings",
      ],
      tips: [
        "Use soft pastel colors: pale pink, lavender, mint, peach",
        "Leave the eyes white for a sparkling effect",
        "Add tiny hearts and stars around the characters",
      ],
      faq: [
        {
          question: "What is the kawaii style?",
          answer: "Kawaii is a Japanese word meaning \"cute\". The kawaii style is characterized by characters with big round eyes, rounded shapes, and soft expressions. It originated in Japan in the 1970s and has spread worldwide.",
        },
        {
          question: "From what age can children color kawaii pages?",
          answer: "From age 3! The rounded shapes and large coloring areas are perfect for very young children. The eye and cheek details remain simple and accessible.",
        },
        {
          question: "What kawaii subjects are available?",
          answer: "Our collection covers a wide variety: kawaii animals (cat, bunny, panda, fox), kawaii food (strawberry, ice cream, cupcake, pizza), kawaii objects (star, cloud, moon, sun), and kawaii fantasy creatures (unicorn, baby dragon).",
        },
      ],
      relatedCategories: ['drole', 'animaux', 'contes', 'princesses-chevaliers'],
    },
  },
  mandalas: {
    fr: {
      intro: "Détendez-vous avec nos coloriages mandalas ! Ces motifs circulaires et symétriques offrent une expérience de coloriage méditative et apaisante. Du mandala simple pour les débutants au mandala complexe pour les experts, notre collection s'adresse aux adultes qui cherchent un moment de calme et de concentration. Le coloriage de mandalas est reconnu pour ses vertus anti-stress et ses bienfaits sur la santé mentale.",
      ageRange: "12 ans et adultes",
      benefits: [
        "Réduction du stress et de l'anxiété",
        "Amélioration de la concentration et de la pleine conscience",
        "Méditation active par le coloriage",
        "Expression artistique sans besoin de compétences en dessin",
      ],
      tips: [
        "Commencez par le centre et progressez vers l'extérieur",
        "Choisissez une palette de 3-4 couleurs harmonieuses",
        "Coloriez dans un endroit calme avec une musique douce",
      ],
      faq: [
        {
          question: "Le coloriage de mandalas aide-t-il vraiment contre le stress ?",
          answer: "Oui, des études ont montré que le coloriage de motifs répétitifs et symétriques comme les mandalas active un état méditatif qui réduit le cortisol (hormone du stress) et favorise la relaxation.",
        },
        {
          question: "Faut-il être bon en dessin pour colorier des mandalas ?",
          answer: "Pas du tout ! Les contours sont déjà tracés, il suffit de remplir les zones avec les couleurs de votre choix. C'est une activité accessible à tous, sans aucune compétence artistique requise.",
        },
        {
          question: "Quel matériel est recommandé pour les mandalas ?",
          answer: "Les crayons de couleur sont idéaux pour les détails fins. Les feutres à pointe fine fonctionnent aussi très bien. Évitez les feutres trop épais qui déborderont sur les petites zones.",
        },
      ],
      relatedCategories: ['mosaiques', 'abstrait', 'paysages', 'nature'],
    },
    en: {
      intro: "Relax with our mandala coloring pages! These circular, symmetrical patterns offer a meditative and soothing coloring experience. From simple mandalas for beginners to complex designs for experts, our collection is designed for adults seeking a moment of calm and focus. Mandala coloring is recognized for its anti-stress properties and mental health benefits.",
      ageRange: "12 years and adults",
      benefits: [
        "Reducing stress and anxiety",
        "Improving concentration and mindfulness",
        "Active meditation through coloring",
        "Artistic expression without drawing skills needed",
      ],
      tips: [
        "Start from the center and work outward",
        "Choose a harmonious palette of 3-4 colors",
        "Color in a quiet place with soft music",
      ],
      faq: [
        {
          question: "Does mandala coloring really help with stress?",
          answer: "Yes, studies have shown that coloring repetitive, symmetrical patterns like mandalas activates a meditative state that reduces cortisol (stress hormone) and promotes relaxation.",
        },
        {
          question: "Do I need to be good at drawing to color mandalas?",
          answer: "Not at all! The outlines are already drawn — just fill in the areas with colors of your choice. It's an activity accessible to everyone, no artistic skills required.",
        },
        {
          question: "What materials are recommended for mandalas?",
          answer: "Colored pencils are ideal for fine details. Fine-tipped markers also work very well. Avoid thick markers that will bleed into small areas.",
        },
      ],
      relatedCategories: ['mosaiques', 'abstrait', 'paysages', 'nature'],
    },
  },
  mosaiques: {
    fr: {
      intro: "Explorez l'art de la mosaïque avec nos coloriages ! Motifs géométriques, tessellations colorées, compositions abstraites — notre collection de mosaïques offre un défi créatif gratifiant pour les adultes et les adolescents. Chaque motif se compose de dizaines de petites formes à colorier individuellement, créant un effet visuel spectaculaire une fois terminé.",
      ageRange: "12 ans et adultes",
      benefits: [
        "Développement de la patience et de la persévérance",
        "Apprentissage des harmonies de couleurs",
        "Effet méditatif et relaxant",
        "Création d'œuvres décoratives impressionnantes",
      ],
      tips: [
        "Planifiez votre palette de couleurs avant de commencer",
        "Alternez les couleurs de façon régulière pour un bel effet",
        "Prenez votre temps — le résultat final en vaut la peine",
      ],
      faq: [
        {
          question: "Quelle est la différence entre mosaïques et mandalas ?",
          answer: "Les mandalas sont circulaires et symétriques, tandis que les mosaïques utilisent des motifs géométriques variés qui peuvent couvrir toute la page. Les mosaïques sont souvent plus axées sur les formes et les couleurs.",
        },
        {
          question: "Combien de temps faut-il pour terminer une mosaïque ?",
          answer: "Selon la complexité, une mosaïque peut prendre de 30 minutes à plusieurs heures. C'est justement ce qui en fait une activité de détente prolongée idéale.",
        },
        {
          question: "Les mosaïques sont-elles adaptées aux enfants ?",
          answer: "Les mosaïques simples conviennent dès 10-12 ans. Pour les plus jeunes, nous recommandons nos catégories enfants avec des dessins aux contours plus larges.",
        },
      ],
      relatedCategories: ['mandalas', 'abstrait', 'cartes', 'paysages'],
    },
    en: {
      intro: "Explore the art of mosaic with our coloring pages! Geometric patterns, colorful tessellations, abstract compositions — our mosaic collection offers a rewarding creative challenge for adults and teens. Each pattern is composed of dozens of small shapes to color individually, creating a spectacular visual effect when completed.",
      ageRange: "12 years and adults",
      benefits: [
        "Developing patience and perseverance",
        "Learning color harmonies",
        "Meditative and relaxing effect",
        "Creating impressive decorative artworks",
      ],
      tips: [
        "Plan your color palette before starting",
        "Alternate colors regularly for a beautiful effect",
        "Take your time — the final result is worth it",
      ],
      faq: [
        {
          question: "What's the difference between mosaics and mandalas?",
          answer: "Mandalas are circular and symmetrical, while mosaics use varied geometric patterns that can cover the entire page. Mosaics often focus more on shapes and colors.",
        },
        {
          question: "How long does it take to complete a mosaic?",
          answer: "Depending on complexity, a mosaic can take from 30 minutes to several hours. That's precisely what makes it an ideal extended relaxation activity.",
        },
        {
          question: "Are mosaics suitable for children?",
          answer: "Simple mosaics are suitable from age 10-12. For younger children, we recommend our kids categories with larger outlines.",
        },
      ],
      relatedCategories: ['mandalas', 'abstrait', 'cartes', 'paysages'],
    },
  },
  abstrait: {
    fr: {
      intro: "Libérez votre créativité avec nos coloriages abstraits ! Formes libres, courbes fluides, motifs organiques — notre collection abstraite est une invitation à l'expression artistique sans contraintes. Pas de règles, pas de couleurs imposées : chaque page est un espace de liberté créative totale. Idéal pour les adultes qui veulent se détendre tout en explorant leur sensibilité artistique.",
      ageRange: "14 ans et adultes",
      benefits: [
        "Expression créative libre et sans jugement",
        "Exploration des couleurs et des harmonies",
        "Relaxation profonde et lâcher-prise",
        "Développement de la sensibilité artistique",
      ],
      tips: [
        "Laissez-vous guider par votre intuition pour les couleurs",
        "Expérimentez avec des dégradés et des mélanges",
        "Il n'y a pas de mauvais choix — tout est permis !",
      ],
      faq: [
        {
          question: "Qu'est-ce qu'un coloriage abstrait ?",
          answer: "Un coloriage abstrait ne représente pas un objet reconnaissable. Il est composé de formes libres, de lignes et de motifs que vous pouvez colorier selon votre humeur et votre inspiration.",
        },
        {
          question: "Faut-il respecter des couleurs particulières ?",
          answer: "Absolument pas ! C'est justement l'intérêt de l'abstrait : il n'y a aucune couleur « correcte ». Laissez-vous guider par vos envies et vos émotions du moment.",
        },
        {
          question: "Les coloriages abstraits sont-ils relaxants ?",
          answer: "Très ! L'absence de « modèle à suivre » libère de la pression de bien faire et permet de se concentrer uniquement sur le plaisir de colorier.",
        },
      ],
      relatedCategories: ['mandalas', 'mosaiques', 'paysages', 'cartes'],
    },
    en: {
      intro: "Unleash your creativity with our abstract coloring pages! Free forms, fluid curves, organic patterns — our abstract collection is an invitation to artistic expression without constraints. No rules, no imposed colors: each page is a space of total creative freedom. Ideal for adults who want to relax while exploring their artistic sensibility.",
      ageRange: "14 years and adults",
      benefits: [
        "Free creative expression without judgment",
        "Exploring colors and harmonies",
        "Deep relaxation and letting go",
        "Developing artistic sensibility",
      ],
      tips: [
        "Let your intuition guide your color choices",
        "Experiment with gradients and blending",
        "There are no wrong choices — everything is allowed!",
      ],
      faq: [
        {
          question: "What is an abstract coloring page?",
          answer: "An abstract coloring page doesn't represent a recognizable object. It's made of free forms, lines and patterns that you can color according to your mood and inspiration.",
        },
        {
          question: "Do I need to follow specific colors?",
          answer: "Absolutely not! That's precisely the beauty of abstract art: there are no 'correct' colors. Let yourself be guided by your desires and emotions of the moment.",
        },
        {
          question: "Are abstract coloring pages relaxing?",
          answer: "Very much so! The absence of a 'model to follow' frees you from the pressure of doing it right and lets you focus solely on the pleasure of coloring.",
        },
      ],
      relatedCategories: ['mandalas', 'mosaiques', 'paysages', 'cartes'],
    },
  },
  cartes: {
    fr: {
      intro: "Explorez le monde avec nos coloriages de cartes ! Cartes du monde, cartes de pays, plans de villes imaginaires, cartes au trésor — notre collection combine géographie et créativité. Les enfants et les adultes peuvent colorier les continents, tracer des routes et inventer leurs propres territoires. Une façon originale et ludique de découvrir la géographie.",
      ageRange: "6 ans et adultes",
      benefits: [
        "Apprentissage de la géographie de manière ludique",
        "Développement de la conscience spatiale",
        "Stimulation de l'imagination cartographique",
        "Activité éducative pour les écoles",
      ],
      tips: [
        "Utilisez une couleur différente pour chaque pays ou région",
        "Ajoutez des symboles pour les capitales et les points d'intérêt",
        "Combinez avec un atlas pour un apprentissage complet",
      ],
      faq: [
        {
          question: "Les cartes sont-elles géographiquement exactes ?",
          answer: "Nos cartes sont simplifiées et stylisées pour être facilement coloriables, tout en respectant les formes générales des continents et des pays.",
        },
        {
          question: "Peut-on utiliser ces cartes pour l'école ?",
          answer: "Oui ! Nos cartes sont parfaites pour accompagner des cours de géographie. Les enseignants peuvent les imprimer gratuitement pour toute la classe.",
        },
        {
          question: "Y a-t-il des cartes imaginaires ?",
          answer: "Oui ! En plus des cartes géographiques, nous proposons des cartes au trésor et des plans de villes fantastiques qui stimulent l'imagination.",
        },
      ],
      relatedCategories: ['nature', 'paysages', 'pirates', 'espace'],
    },
    en: {
      intro: "Explore the world with our map coloring pages! World maps, country maps, imaginary city plans, treasure maps — our collection combines geography and creativity. Children and adults can color continents, trace routes and invent their own territories. An original and fun way to discover geography.",
      ageRange: "6 years and adults",
      benefits: [
        "Learning geography in a fun way",
        "Developing spatial awareness",
        "Stimulating cartographic imagination",
        "Educational activity for schools",
      ],
      tips: [
        "Use a different color for each country or region",
        "Add symbols for capitals and points of interest",
        "Combine with an atlas for comprehensive learning",
      ],
      faq: [
        {
          question: "Are the maps geographically accurate?",
          answer: "Our maps are simplified and stylized for easy coloring, while respecting the general shapes of continents and countries.",
        },
        {
          question: "Can these maps be used for school?",
          answer: "Yes! Our maps are perfect for geography lessons. Teachers can print them for free for the whole class.",
        },
        {
          question: "Are there imaginary maps?",
          answer: "Yes! In addition to geographic maps, we offer treasure maps and fantastic city plans that stimulate imagination.",
        },
      ],
      relatedCategories: ['nature', 'paysages', 'pirates', 'espace'],
    },
  },
  paysages: {
    fr: {
      intro: "Évadez-vous avec nos coloriages paysages ! Montagnes enneigées, plages tropicales, forêts enchantées, villages pittoresques — chaque illustration est une invitation au voyage et à la contemplation. Notre collection de paysages offre des scènes détaillées qui font le bonheur des coloristes adultes et des adolescents. Idéal pour un moment de calme et d'évasion créative.",
      ageRange: "10 ans et adultes",
      benefits: [
        "Évasion et relaxation par l'art",
        "Développement du sens du détail et des perspectives",
        "Exploration des palettes de couleurs naturelles",
        "Activité méditative et apaisante",
      ],
      tips: [
        "Commencez par l'arrière-plan et progressez vers le premier plan",
        "Utilisez des dégradés pour le ciel et l'eau",
        "Observez de vraies photos de paysages pour vous inspirer",
      ],
      faq: [
        {
          question: "Les paysages sont-ils adaptés aux enfants ?",
          answer: "Nos paysages sont principalement conçus pour les adultes et adolescents avec des détails fins. Les enfants à partir de 10 ans apprécieront les scènes les plus simples.",
        },
        {
          question: "Quels types de paysages sont disponibles ?",
          answer: "Montagnes, plages, forêts, lacs, villages, jardins, cascades, déserts et scènes urbaines composent notre collection variée de paysages.",
        },
        {
          question: "Quel matériel est conseillé pour les paysages ?",
          answer: "Les crayons de couleur sont parfaits pour les dégradés et les détails. L'aquarelle (sur papier adapté) peut donner de très beaux résultats pour les ciels et l'eau.",
        },
      ],
      relatedCategories: ['nature', 'saisons', 'mandalas', 'abstrait'],
    },
    en: {
      intro: "Escape with our landscape coloring pages! Snow-capped mountains, tropical beaches, enchanted forests, picturesque villages — each illustration is an invitation to travel and contemplation. Our landscape collection offers detailed scenes that delight adult colorists and teenagers. Ideal for a moment of calm and creative escape.",
      ageRange: "10 years and adults",
      benefits: [
        "Escape and relaxation through art",
        "Developing a sense of detail and perspective",
        "Exploring natural color palettes",
        "A meditative and soothing activity",
      ],
      tips: [
        "Start with the background and work toward the foreground",
        "Use gradients for sky and water",
        "Look at real landscape photos for inspiration",
      ],
      faq: [
        {
          question: "Are the landscapes suitable for children?",
          answer: "Our landscapes are primarily designed for adults and teens with fine details. Children from age 10 will enjoy the simpler scenes.",
        },
        {
          question: "What types of landscapes are available?",
          answer: "Mountains, beaches, forests, lakes, villages, gardens, waterfalls, deserts and urban scenes make up our varied landscape collection.",
        },
        {
          question: "What materials are recommended for landscapes?",
          answer: "Colored pencils are perfect for gradients and details. Watercolors (on suitable paper) can produce beautiful results for skies and water.",
        },
      ],
      relatedCategories: ['nature', 'saisons', 'mandalas', 'abstrait'],
    },
  },
};

export function getPillarContent(category: Category, locale: Locale): PillarData | null {
  return pillarContent[category]?.[locale] ?? null;
}

export type Level = 'A1' | 'A2' | 'B1';

export interface SubTopic {
  title: string;
  texts: Record<Level, string>;
}

export interface Category {
  id: string;
  name: string;
  subTopics: SubTopic[];
}

export const DB: Category[] = [
  {
    id: 'plants',
    name: 'Plants (گیاهان)',
    subTopics: [
      {
        title: 'Rose (رز)',
        texts: {
          A1: "A rose is a red flower. It smells very good. It has sharp thorns. I like roses.",
          A2: "A rose is a beautiful flower that comes in many colors like red and white. It has sharp thorns on its green stem. People give roses as gifts.",
          B1: "The rose is a classic symbol of love and beauty, characterized by its fragrant petals and thorny stem. They require careful pruning and plenty of sunlight to thrive."
        }
      },
      {
        title: 'Apple Tree (درخت سیب)',
        texts: {
          A1: "An apple tree is big. It has red apples. The apples are sweet. Birds sit on it.",
          A2: "An apple tree grows tall and produces sweet red fruits in the autumn. In spring, it features beautiful white flowers that attract bees.",
          B1: "Apple trees are cultivated worldwide for their fruit. They undergo a seasonal cycle of blossoming in spring and bearing mature fruit by late autumn."
        }
      },
      {
        title: 'Grass (چمن)',
        texts: {
          A1: "Grass is green. It is on the ground. Cows eat grass. I run on grass.",
          A2: "Grass covers the ground in parks and gardens like a green carpet. Many farm animals eat grass to live, and it needs rain to stay healthy.",
          B1: "Grass refers to a variety of low-growing plants that form continuous cover. It plays a vital role in ecosystems by preventing soil erosion."
        }
      },
      {
        title: 'Sunflower (آفتاب‌گردان)',
        texts: {
          A1: "A sunflower is yellow. It is very tall. It looks at the sun. I eat its seeds.",
          A2: "A sunflower is a tall plant with bright yellow petals. It naturally turns its large head to face the sun as it moves across the sky.",
          B1: "Sunflowers are distinctive crops cultivated for their edible seeds and oil. Their unique heliotropic behavior allows them to track the sun's trajectory."
        }
      },
      {
        title: 'Cactus (کاکتوس)',
        texts: {
          A1: "A cactus is green. It lives in the desert. It is hot there. It has sharp needles.",
          A2: "A cactus is a tough plant that survives in hot, dry deserts. Instead of normal leaves, it is covered in sharp needles to protect its water.",
          B1: "Cacti are highly adapted to arid environments, utilizing modified stems for water storage and sharp spines to deter herbivores."
        }
      },
      {
        title: 'Oak Tree (بلوط)',
        texts: {
          A1: "The oak tree is big. It brings dark shade. Squirrels live in it. It is very old.",
          A2: "The oak tree grows to be very large and provides excellent shade. Small animals like squirrels build their homes in its strong branches.",
          B1: "Oak trees are majestic hardwood trees known for their longevity and strength. They support complex micro-ecosystems in ancient forests."
        }
      },
      {
        title: 'Tulip (لاله)',
        texts: {
          A1: "A tulip is a nice flower. It is red or pink. It grows in spring. I like it.",
          A2: "Tulips are popular spring flowers that grow from small bulbs. They bloom in bright colors and look beautiful in large open fields.",
          B1: "The tulip is a prominent spring-blooming perennial. Historically, it triggered a massive economic bubble in the Netherlands due to its striking appearance."
        }
      },
      {
        title: 'Bamboo (بامبو)',
        texts: {
          A1: "Bamboo is tall. It is green. Pandas eat bamboo. It grows super fast.",
          A2: "Bamboo is a very fast-growing plant that looks like a tall green stick. Pandas love to eat its fresh leaves in the forest.",
          B1: "Bamboo is an extraordinarily fast-growing grass used extensively in construction and textiles. It is also the primary dietary source for giant pandas."
        }
      },
      {
        title: 'Seaweed (جلبک دریایی)',
        texts: {
          A1: "Seaweed is under water. It is in the sea. Fish hide in it. It is green.",
          A2: "Seaweed is a plant that grows underwater in the salty ocean. Many small fish hide inside it, and some people cook with it.",
          B1: "Marine algae, commonly known as seaweed, provides essential marine habitats and serves as a highly nutritious food source rich in iodine."
        }
      },
      {
        title: 'Moss (خزه)',
        texts: {
          A1: "Moss is very small. It is on rocks. It likes water. It is soft.",
          A2: "Moss is a small, soft green plant that grows on rocks and trees in damp places. It feels like a small carpet in the forest.",
          B1: "Mosses are non-vascular plants that thrive in damp, shaded environments. They absorb water directly through their leaves and aid in soil retention."
        }
      }
    ]
  },
  {
    id: 'people',
    name: 'Humans (انسان)',
    subTopics: [
      {
        title: 'Girl (دختر)',
        texts: {
          A1: "The girl is young. She plays with toys. She goes to school. She is happy.",
          A2: "A young girl enjoys playing outside and going to school with her friends. She is very curious and happy.",
          B1: "The young girl demonstrates a profound curiosity for the world, engaging actively in her academic pursuits and social relationships."
        }
      },
      {
        title: 'Boy (پسر)',
        texts: {
          A1: "The boy runs fast. He likes sports. He plays with friends. He is strong.",
          A2: "An active boy runs fast in the park and enjoys playing team sports with his classmates.",
          B1: "The young boy exhibits significant physical stamina, frequently participating in competitive sports and collaborative team efforts."
        }
      },
      {
        title: 'Man (مرد)',
        texts: {
          A1: "The man is tall. He goes to work. He is a father. He is kind.",
          A2: "The adult man works hard every day to provide for his family and helps his neighbors.",
          B1: "The mature man balances his professional responsibilities with a strong commitment to supporting his local community."
        }
      },
      {
        title: 'Woman (زن)',
        texts: {
          A1: "The woman is smart. She reads books. She is a mother. She works hard.",
          A2: "The independent woman reads many books and pursues her career with great passion and intelligence.",
          B1: "The woman navigates her sophisticated career path with remarkable emotional intelligence and a dedication to continuous learning."
        }
      },
      {
        title: 'Interests (علاقه‌ها)',
        texts: {
          A1: "I like music. I like art. I read books. They are fun.",
          A2: "People have different hobbies like listening to music, painting beautiful art, or reading great books.",
          B1: "Personal interests and hobbies provide essential psychological relief and foster creative expression in individuals."
        }
      },
      {
        title: 'Inventions (اختراعات)',
        texts: {
          A1: "A car is an invention. A phone is new. They help us. We use them.",
          A2: "Human inventions like cars, airplanes, and smartphones have made our modern lives much easier and faster.",
          B1: "Technological inventions have radically transformed human civilization, facilitating global communication and redefining modern transportation."
        }
      },
      {
        title: 'Family (خانواده)',
        texts: {
          A1: "My family is big. I have a brother. I have a sister. I love them.",
          A2: "A family lives together and supports each other. Many families share meals and talk about their day.",
          B1: "The family unit serves as the foundational structure of society, offering essential emotional support and social development."
        }
      },
      {
        title: 'Friends (دوستان)',
        texts: {
          A1: "I have good friends. We play games. We talk a lot. We laugh.",
          A2: "Friends are people you choose to spend time with. Good friends listen to you and help you when you are sad.",
          B1: "Meaningful friendships significantly enhance psychological well-being by providing a reliable network of empathy and mutual understanding."
        }
      },
      {
        title: 'Jobs (مشاغل)',
        texts: {
          A1: "People have jobs. A doctor helps us. A teacher talks. Work is good.",
          A2: "Adults need jobs to make money and help their community. Doctors help sick people and teachers educate students.",
          B1: "Professional careers require specialized training and contribute directly to the economic and structural development of a society."
        }
      },
      {
        title: 'Education (آموزش)',
        texts: {
          A1: "I go to school. I learn new things. I read a lot. School is nice.",
          A2: "Education is very important for children. Going to school helps them learn math, science, and how to read.",
          B1: "Formal education equips individuals with analytical skills and critical knowledge, fundamentally shaping their future professional trajectories."
        }
      }
    ]
  },
  {
    id: 'body',
    name: 'Body Parts (اعضای بدن)',
    subTopics: [
      {
        title: 'Heart (قلب)',
        texts: {
          A1: "My heart is red. It goes thump thump. It is inside me. It keeps me alive.",
          A2: "The heart is an important muscle inside your chest. It pumps blood all over your body without ever stopping to rest.",
          B1: "The human heart is a vital muscular organ that functions as a continuous pump, circulating oxygen-rich blood throughout the vascular system."
        }
      },
      {
        title: 'Brain (مغز)',
        texts: {
          A1: "My brain is in my head. I use it to think. I learn with my brain. It is smart.",
          A2: "Your brain is located inside your head and controls everything you do. It helps you think, remember things, and feel emotions.",
          B1: "The brain is a highly complex neurological structure acting as the body's control center, responsible for cognitive functions, memory, and involuntary actions."
        }
      },
      {
        title: 'Eyes (چشم‌ها)',
        texts: {
          A1: "I have two eyes. I see with them. I see colors. I close them to sleep.",
          A2: "You use your two eyes to see the beautiful world around you. They come in different colors like brown, blue, or green.",
          B1: "The eyes are intricate sensory organs that process visible light into electrical signals, enabling sophisticated visual perception and spatial awareness."
        }
      },
      {
        title: 'Skin (پوست)',
        texts: {
          A1: "My skin is soft. It covers my body. I feel things with it. It gets warm.",
          A2: "Skin is the outer covering of your body that protects you from dirt. You use it to touch objects and feel if they are hot or cold.",
          B1: "The skin is the human body's largest organ, serving as a critical barrier against pathogens while regulating temperature and enabling tactile sensation."
        }
      },
      {
        title: 'Bones (استخوان‌ها)',
        texts: {
          A1: "Bones are white. They are very hard. They make me stand. I have many bones.",
          A2: "Bones are the hard parts under your skin that give your body its shape. Drinking milk helps keep your bones strong and healthy.",
          B1: "The skeletal system provides structural integrity to the body, protects internal organs, and facilitates rapid movement in conjunction with muscles."
        }
      },
      {
        title: 'Muscles (ماهیچه‌ها)',
        texts: {
          A1: "Muscles make me strong. I use them to run. I use them to lift. They are under my skin.",
          A2: "Muscles are connected to your bones and help you move around. If you exercise, your muscles will grow bigger and stronger.",
          B1: "Muscular tissues are specialized structures that generate force through contraction, enabling both voluntary locomotion and essential involuntary bodily functions."
        }
      },
      {
        title: 'Blood (خون)',
        texts: {
          A1: "Blood is red. It flows in me. When I cut my hand, I see blood.",
          A2: "Blood is the red liquid moving quickly through your body inside tiny tubes. It carries food and oxygen to everywhere you need them.",
          B1: "Blood is a specialized bodily fluid responsible for transporting oxygen, nutrients, and immune cells to tissues while removing metabolic waste products."
        }
      },
      {
        title: 'Lungs (ریه‌ها)',
        texts: {
          A1: "I have two lungs. I breathe air. I breathe in and out. I need air.",
          A2: "Your two lungs help you breathe air from the outside. When you take a deep breath, they expand inside your chest like a balloon.",
          B1: "The lungs are primary respiratory organs that facilitate the vital exchange of oxygen and carbon dioxide between the atmosphere and the bloodstream."
        }
      },
      {
        title: 'Teeth (دندان‌ها)',
        texts: {
          A1: "My teeth are white. I chew my food. I brush my teeth. They are hard.",
          A2: "You use your teeth to chew your food before you swallow it. It is very important to brush them every day to stop bad cavities.",
          B1: "Teeth are calcified structures located in the jaw, mechanically breaking down food for efficient digestion while playing a key role in verbal articulation."
        }
      },
      {
        title: 'Hair (مو)',
        texts: {
          A1: "My hair is on my head. It can be black or brown. I wash it. I comb it.",
          A2: "Hair grows on top of your head to keep it warm. People often cut or style their hair to look nice.",
          B1: "Hair consists of robust protein filaments that provide thermal insulation and sensory input, deeply rooted in the dermal layer of the skin."
        }
      }
    ]
  },
  {
    id: 'space',
    name: 'Space (فضا)',
    subTopics: [
      {
        title: 'Mars (مریخ)',
        texts: {
          A1: "Mars is red. It is a planet. It is in space. It is cold.",
          A2: "Mars is famous for being the red planet next to Earth. Scientists hope humans will visit it soon to see if there is any water.",
          B1: "Mars frequently captures scientific interest due to its potential for past microbial life. It features a thin atmosphere and distinct geological formations like dormant volcanoes."
        }
      },
      {
        title: 'Earth (زمین)',
        texts: {
          A1: "Earth is my home. It is blue and green. It has water. We live here.",
          A2: "Earth is the beautiful planet where all animals and humans live. It is mostly covered by blue oceans and has clouds in the sky.",
          B1: "Earth is the only known celestial body to harbor life, characterized by its abundant liquid surface water, vital atmosphere, and active tectonics."
        }
      },
      {
        title: 'Jupiter (مشتری)',
        texts: {
          A1: "Jupiter is very big. It has a red spot. It is round. It stays in space.",
          A2: "Jupiter is the largest planet in our whole solar system. It is completely made of gas and has a huge, spinning red storm on it.",
          B1: "Jupiter is a gas giant commanding immense gravitational influence in the solar system, famously hosting the Great Red Spot—a massive, persistent anticyclonic storm."
        }
      },
      {
        title: 'Saturn (زحل)',
        texts: {
          A1: "Saturn has rings. The rings are pretty. It is big. It spins fast.",
          A2: "Saturn is a big planet surrounded by beautiful, wide rings. These rings are actually made of many small pieces of ice and floating rocks.",
          B1: "Saturn is distinguished by its extensive and complex ring system, composed primarily of ice particles with a smaller amount of rocky debris and dust."
        }
      },
      {
        title: 'Moon (ماه)',
        texts: {
          A1: "The moon is in the sky. It is night time. It is white. It shines.",
          A2: "The moon shines brightly in the night sky and changes its shape over the month. Astronauts have traveled there to walk on its surface.",
          B1: "The Moon serves as Earth's only permanent natural satellite, exerting a significant gravitational pull that results in the generation of oceanic tides."
        }
      },
      {
        title: 'Sun (خورشید)',
        texts: {
          A1: "The sun is hot. It is day time. It is a star. It is yellow.",
          A2: "The sun is a very hot and bright star right in the center of our system. It gives the Earth the light and warmth we need to live.",
          B1: "The Sun is a main-sequence star situated at the core of the solar system. Its continuous nuclear fusion provides the indispensable energy required to sustain terrestrial ecosystems."
        }
      },
      {
        title: 'Black Hole (سیاه‌چاله)',
        texts: {
          A1: "A black hole is dark. It pulls things. No light comes out. It is far away.",
          A2: "A black hole has gravity so strong that it pulls everything inside. Even light cannot escape once it gets too close to the dark center.",
          B1: "A black hole exhibits an intense gravitational field stemming from immense mass concentrated in a singularity, rendering its event horizon entirely inescapable."
        }
      },
      {
        title: 'Comet (دنباله‌دار)',
        texts: {
          A1: "A comet goes fast. It has a long tail. It is made of ice. It is in space.",
          A2: "A comet is like a dirty snowball flying through space. When it gets near the sun, it melts a bit and gets a glowing tail.",
          B1: "Comets are cosmic bodies composed of frozen gases, rocks, and cosmic dust. As they approach the sun, solar radiation produces a spectacular, luminous tail."
        }
      },
      {
        title: 'Astronaut (فضانورد)',
        texts: {
          A1: "The astronaut flies high. He wears a suit. He goes to space. He sees stars.",
          A2: "An astronaut is a trained person who travels into dangerous space. They wear thick white suits to stay safe outside the spaceship.",
          B1: "Astronauts undergo rigorous physiological and psychological training to endure the harsh conditions of microgravity while conducting critical scientific research in orbit."
        }
      },
      {
        title: 'Telescope (تلسکوپ)',
        texts: {
          A1: "A telescope is long. I look inside it. I see stars. Stars look big.",
          A2: "A telescope is a magical tool that helps you see things that are very far away. Scientists use huge ones to study distant planets and moons.",
          B1: "Telescopes are essential optical instruments utilizing lenses or curved mirrors to gather and focus light, vastly expanding our capacity to observe distant celestial phenomena."
        }
      }
    ]
  }
];

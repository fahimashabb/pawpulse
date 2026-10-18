const { db, insertArticle, getArticleCount, logPublishing } = require('./db');
const { generateSlug, calculateReadingTime } = require('../services/seo-helper');

console.log('--- Starting Seeding of 200+ Comprehensive Pet Care Articles ---');

// Unsplash high quality pet photos mapped by category/species
const PET_IMAGES = {
  cat_sleep: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&auto=format&fit=crop&q=80',
  cat_nails: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1000&auto=format&fit=crop&q=80',
  cat_play: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1000&auto=format&fit=crop&q=80',
  cat_orange: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1000&auto=format&fit=crop&q=80',
  cat_white: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1000&auto=format&fit=crop&q=80',
  dog_zoomies: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1000&auto=format&fit=crop&q=80',
  dog_leash: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1000&auto=format&fit=crop&q=80',
  dog_chew: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1000&auto=format&fit=crop&q=80',
  dog_puppy: 'https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=1000&auto=format&fit=crop&q=80',
  dog_golden: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1000&auto=format&fit=crop&q=80',
  parrot_color: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1000&auto=format&fit=crop&q=80',
  bird_cockatiel: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0701?w=1000&auto=format&fit=crop&q=80',
  bird_budgie: 'https://images.unsplash.com/photo-1522858547137-f1dcec554f55?w=1000&auto=format&fit=crop&q=80',
  reptile_dragon: 'https://images.unsplash.com/photo-1533651180995-3b8dcd33e834?w=1000&auto=format&fit=crop&q=80',
  reptile_gecko: 'https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?w=1000&auto=format&fit=crop&q=80',
  reptile_chameleon: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1000&auto=format&fit=crop&q=80',
  snake_ball_python: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=1000&auto=format&fit=crop&q=80',
  snake_corn: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=1000&auto=format&fit=crop&q=80',
  rabbit_cute: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1000&auto=format&fit=crop&q=80',
  guinea_pig: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1000&auto=format&fit=crop&q=80',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1000&auto=format&fit=crop&q=80',
  aquatic_betta: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1000&auto=format&fit=crop&q=80',
  aquatic_tank: 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=1000&auto=format&fit=crop&q=80'
};

const VET_AUTHORS = [
  { name: 'Dr. Julian Vance, DVM', role: 'Veterinary Behavior Specialist', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Dr. Elena Rostova, DVM, DACVB', role: 'Board-Certified Veterinary Behaviorist', avatar: 'https://images.unsplash.com/photo-1594824813629-d89771239c4d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Marcus Sterling, CABC', role: 'Certified Applied Animal Behaviorist', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80' },
  { name: 'Dr. Siobhan Thorne, PhD, DVM', role: 'Avian & Exotic Zoological Specialist', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Dr. Alexander Hayes, DVM', role: 'Herpetological Clinical Researcher', avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80' }
];

// Topic blueprints to construct 210+ comprehensive articles
const ARTICLE_BLUEPRINTS = [
  // --- CATS (40) ---
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_sleep,
    title: 'Why Do Cats Twitch While Sleeping? The Neurological Science of Feline REM Dreams',
    slug: 'why-do-cats-twitch-while-sleeping-rem-dreams',
    isPopular: true, isFeatured: true,
    metaDesc: 'Discover why cats twitch their paws, whiskers, and eyelids during sleep. Learn the veterinary neurology behind feline REM dreams and when twitching is normal vs medical.',
    topicKey: 'cat_dreaming'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_nails,
    title: 'How to Clip Cat Nails Safely: The Pain-Free Fear-Free Veterinary Protocol',
    slug: 'how-to-clip-cat-nails-safely-veterinary-protocol',
    isPopular: true, isFeatured: true, schemaType: 'HowTo',
    metaDesc: 'Step-by-step veterinary guide to trimming your cat\'s claws without stress or bleeding. Learn the quick anatomy, clipper angles, and desensitization steps.',
    topicKey: 'cat_nails'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_play,
    title: 'The Feline Purr Decoded: Frequency Healing, Distress Calls, and Solicitous Vocalizations',
    slug: 'feline-purr-decoded-science-healing-frequencies',
    isPopular: true,
    metaDesc: 'Scientific breakdown of why cats purr. Explore 20-140 Hz bone-healing vibrations, nursery communication, and high-frequency solicitous food purrs.',
    topicKey: 'cat_purr'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_orange,
    title: 'Litter Box Aversion Solved: Substrate Preferences, Box Sizing, and Elimination Anxiety',
    slug: 'litter-box-aversion-solved-veterinary-troubleshooting',
    isPopular: true,
    metaDesc: 'Is your cat peeing outside the box? Clinical troubleshooting for substrate scent, box placement, feline idiopathic cystitis (FIC), and box sizing.',
    topicKey: 'cat_litter'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_white,
    title: 'Chronic Kidney Disease in Senior Cats: Early Biomarkers, SDMA & Renal Diets',
    slug: 'chronic-kidney-disease-senior-cats-sdma-renal-diets',
    isFeatured: true,
    metaDesc: 'Early detection protocol for feline CKD. Understand SDMA testing, phosphorus binders, hydration therapy, and wet food transitions.',
    topicKey: 'cat_kidney'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_sleep,
    title: 'Cat Tail Language: 12 Subtle Signals Every Cat Guardian Must Know',
    slug: 'cat-tail-language-subtle-behavior-signals',
    metaDesc: 'Decode your cat’s tail movements. From the upward question mark to low thumping and puffing, learn exact emotional states.',
    topicKey: 'cat_tail'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_play,
    title: 'Feline Play Aggression vs Genuine Fear: Stopping the Ankle Ambush',
    slug: 'feline-play-aggression-stopping-ankle-ambush',
    metaDesc: 'Why does your cat attack your feet as you walk by? Understanding predatory motor patterns and how structured wand play redirects biting.',
    topicKey: 'cat_play_aggression'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_orange,
    title: 'Cat Whisker Fatigue: Sensory Overload and Ergonomic Feeding Solutions',
    slug: 'cat-whisker-fatigue-sensory-overload-bowl-guide',
    metaDesc: 'What is whisker fatigue in felines? Learn how deep food bowls overstimulate trigeminal nerve endings and causes messy eating.',
    topicKey: 'cat_whisker'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_white,
    title: 'How to Introduce Two Unfamiliar Cats: Jackson Galaxy Basecamp Method Explained',
    slug: 'how-to-introduce-unfamiliar-cats-basecamp-protocol',
    schemaType: 'HowTo',
    metaDesc: 'Step-by-step protocol for introducing new cats. Scent swapping, site swapping, visual barriers, and mealtime positive conditioning.',
    topicKey: 'cat_intro'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_sleep,
    title: 'Why Does My Cat Stare at Blank Walls? Low-Frequency Hearing & Tapetum Lucidum Vision',
    slug: 'why-does-cat-stare-at-blank-walls-sensory-science',
    metaDesc: 'Are cats seeing ghosts? The acoustic and optical reality behind cats fixating on empty walls and corners.',
    topicKey: 'cat_wall_stare'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_play,
    title: 'Feline Hyperesthesia Syndrome (Rolling Skin Disease): Symptoms & Calm Protocols',
    slug: 'feline-hyperesthesia-syndrome-symptoms-care',
    metaDesc: 'Recognizing rippling back muscles, sudden grooming frenzies, and tail chasing in cats. Veterinary diagnostic steps and gabapentin therapy.',
    topicKey: 'cat_fhs'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_orange,
    title: 'Indoor Cat Environmental Enrichment: Vertical Territory and Catio Engineering',
    slug: 'indoor-cat-enrichment-vertical-territory-catio',
    metaDesc: 'Prevent indoor feline depression and obesity with vertical shelving runways, foraging puzzle boxes, and safe outdoor catio enclosures.',
    topicKey: 'cat_enrichment'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_white,
    title: 'Why Do Cats Knead (' + "'Make Biscuits'" + ')? Pheromones, Comfort, and Nursing Memories',
    slug: 'why-cats-knead-make-biscuits-scent-marking',
    metaDesc: 'Why cats rhythmically push their paws into soft blankets and human laps. Interdigital pheromones, neotenic comfort, and relaxation science.',
    topicKey: 'cat_kneading'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_sleep,
    title: 'Cat Hairball Management: Malt Pastes, Fiber Ratios, and Underlying Motility Issues',
    slug: 'cat-hairball-management-motility-fiber-ratios',
    metaDesc: 'Are frequent hairballs normal in cats? How to distinguish gastric trichobezoars from feline asthma and inflammatory bowel disease.',
    topicKey: 'cat_hairballs'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_nails,
    title: 'Signs Your Cat is in Pain: The Feline Grimace Scale and Subtle Behavioral Shifts',
    slug: 'signs-cat-is-in-pain-feline-grimace-scale',
    metaDesc: 'Cats mask pain instinctually. Learn the clinically validated Feline Grimace Scale: ear position, orbital tightening, and muzzle tension.',
    topicKey: 'cat_pain'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_play,
    title: 'Feline Dental Resorption (FORL): Why Cat Teeth Disappear and How to Treat It',
    slug: 'feline-dental-resorption-forl-symptoms-treatment',
    metaDesc: 'Understanding tooth resorption in domestic cats. Symptoms of chattering teeth, oral bleeding, and surgical extraction protocols.',
    topicKey: 'cat_teeth'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_orange,
    title: 'Cat Slow Blinks: The Science Behind the Feline Smile of Trust',
    slug: 'cat-slow-blinks-feline-smile-trust-science',
    metaDesc: 'How the slow-blink sequence acts as the ultimate feline smile and trust signal, proven by animal cognition researchers.',
    topicKey: 'cat_blink'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_white,
    title: 'Hydration Strategies for Cats: Fountains, Broths, and Preventing Bladder Stones',
    slug: 'cat-hydration-strategies-fountains-urinary-care',
    metaDesc: 'Cats have a naturally low thirst drive inherited from desert ancestors. Proven techniques to boost daily water intake and avoid struvite crystals.',
    topicKey: 'cat_hydration'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_sleep,
    title: 'Catnip vs Silvervine vs Valerian Root: The Chemistry of Feline Plant Euphoria',
    slug: 'catnip-vs-silvervine-valerian-chemistry-euphoria',
    metaDesc: 'Why 30% of cats are immune to nepetalactone, and how actinidine in silvervine activates the olfactory opioid system for feline enrichment.',
    topicKey: 'cat_catnip'
  },
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_nails,
    title: 'Senior Cat Arthritis: Home Adaptations, Heated Beds, and Librela Monoclonal Antibodies',
    slug: 'senior-cat-arthritis-home-adaptations-librela',
    metaDesc: 'Over 90% of cats over 12 have arthritis. Discover ramps, low-entry litter pans, and bedinvetmab (Librela) monthly injections.',
    topicKey: 'cat_arthritis'
  },

  // --- DOGS (40) ---
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_zoomies,
    title: 'Why Dogs Get the ' + "'Zoomies'" + ' (FRAPs): Cortisol Release, Joy, and Nervous System Reset',
    slug: 'why-dogs-get-zoomies-fraps-nervous-system',
    isPopular: true, isFeatured: true,
    metaDesc: 'Frenetic Random Activity Periods explained. Why dogs race wildly after baths, pooping, or prolonged crating, and how to keep them safe.',
    topicKey: 'dog_zoomies'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_leash,
    title: 'How to Stop Leash Pulling: Positive Reinforcement & Loose-Leash Walking Mechanics',
    slug: 'how-to-stop-leash-pulling-loose-leash-walking',
    isPopular: true, schemaType: 'HowTo',
    metaDesc: 'Transform chaotic dog walks into serene strolls. Front-clip harnesses, redirection markers, and the ' + "'be a tree'" + ' stopping protocol.',
    topicKey: 'dog_leash_pulling'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    title: 'Canine Separation Anxiety: Sub-Threshold Desensitization and Mission Protocol',
    slug: 'canine-separation-anxiety-desensitization-protocol',
    isPopular: true, isFeatured: true,
    metaDesc: 'Step-by-step clinical protocol to cure separation anxiety in dogs without flooding. Departure cue desensitization and independence training.',
    topicKey: 'dog_separation_anxiety'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_golden,
    title: 'Gastric Dilatation-Volvulus (GDV/Bloat) in Dogs: 5 Golden-Hour Warning Signs',
    slug: 'gastric-dilatation-volvulus-dog-bloat-warning-signs',
    isPopular: true,
    metaDesc: 'Bloat is an acute surgical emergency. Learn unproductive retching, distended abdomen, pacing, and preventive gastropexy options.',
    topicKey: 'dog_bloat'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_chew,
    title: 'Safest Long-Lasting Dog Chews: Bully Sticks, Yak Cheese & Choking Prevention',
    slug: 'safest-long-lasting-dog-chews-choking-prevention',
    metaDesc: 'Veterinary review of safe dog chews. Why cooked bones and rawhide fracture teeth and cause blockages, and what safe alternatives exist.',
    topicKey: 'dog_chews'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    title: 'Puppy Critical Socialization Window (3-14 Weeks): The 100-Exposure Rule',
    slug: 'puppy-critical-socialization-window-checklist',
    schemaType: 'HowTo',
    metaDesc: 'How to properly socialize a puppy before full vaccinations without parvo risk. The 100 novel surfaces, sounds, and positive people encounters.',
    topicKey: 'dog_socialization'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_golden,
    title: 'Raw Feeding (BARF) vs High-Quality Kibble: Nutritional Science & Bacterial Risks',
    slug: 'raw-feeding-barf-vs-kibble-veterinary-nutrition',
    metaDesc: 'An objective veterinary breakdown of raw diets vs WSAVA-compliant extruded kibbles. Calcium-to-phosphorus ratios and salmonella realities.',
    topicKey: 'dog_raw_vs_kibble'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_zoomies,
    title: 'Why Do Dogs Eat Grass? Digestive Motility, Boredom, and Ancestral Herbivory',
    slug: 'why-do-dogs-eat-grass-digestive-motility',
    metaDesc: 'Does eating grass mean your dog is nauseous? Evolutionary reasons dogs graze on spring grass and when to worry about lawn herbicides.',
    topicKey: 'dog_eating_grass'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_leash,
    title: 'Canine Cognitive Dysfunction (Dog Dementia): Symptoms & Cognitive Enrichment',
    slug: 'canine-cognitive-dysfunction-dog-dementia-care',
    metaDesc: 'Recognizing the DISHA acronym in senior dogs. Pacing, sleep cycle reversal, house soiling, and dietary interventions with MCT oils.',
    topicKey: 'dog_dementia'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    title: 'Crate Training Without Tears: Step-by-Step Progressive Conditioning',
    slug: 'crate-training-without-tears-progressive-guide',
    schemaType: 'HowTo',
    metaDesc: 'How to make the crate a cozy den instead of a scary cage. Feeding inside, frozen Lickimats, and gradual door-closing steps.',
    topicKey: 'dog_crate_training'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_golden,
    title: 'Dog Leash Reactivity: Barrier Frustration vs Fear Aggression Counter-Conditioning',
    slug: 'dog-leash-reactivity-counter-conditioning-guide',
    metaDesc: 'Does your dog bark and lunge at other dogs on leash? Learn the Look-At-That (LAT) game and threshold distance management.',
    topicKey: 'dog_reactivity'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_chew,
    title: 'Dog Dental Care at Home: Enzymatic Toothpastes, Water Additives & Finger Brushing',
    slug: 'dog-dental-care-at-home-enzymatic-brushing',
    schemaType: 'HowTo',
    metaDesc: 'Periodontal disease affects 80% of adult dogs. How to train your dog to enjoy daily tooth brushing with enzymatic poultry paste.',
    topicKey: 'dog_dental'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_zoomies,
    title: 'Canine Calming Signals: Decoding Yawning, Lip Licking, and Head Turns',
    slug: 'canine-calming-signals-yawning-lip-licking-stress',
    metaDesc: 'Discover the subtle body language dogs use to diffuse conflict and signal stress before growling or snapping occurs.',
    topicKey: 'dog_calming_signals'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_leash,
    title: 'Exercising High-Drive Working Breeds: Mental Stimulation vs Physical Fatigue',
    slug: 'exercising-high-drive-working-breeds-mental-enrichment',
    metaDesc: 'Why running your Malinois or Border Collie for 5 miles builds an athlete, not a calm dog. The power of nosework, scent games, and shaping.',
    topicKey: 'dog_high_drive'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    title: 'How to Potty Train a Puppy in 7 Days: Scent Marking, Timers & Zero Punishment',
    slug: 'how-to-potty-train-puppy-7-days-management',
    schemaType: 'HowTo',
    metaDesc: 'Foolproof puppy housebreaking guide. Exact timing after waking and meals, enzymatic cleaner usage, and bell-training methods.',
    topicKey: 'dog_potty_training'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_golden,
    title: 'Toxic Foods for Dogs: Xylitol (Birch Bark), Grapes, Onions & Emergency Protocols',
    slug: 'toxic-foods-dogs-xylitol-grapes-emergency-care',
    metaDesc: 'A complete veterinary list of deadly household foods for canines, toxic dosages per kg, and when to induce vomiting vs rush to ER.',
    topicKey: 'dog_toxic_foods'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_chew,
    title: 'Canine Hip Dysplasia: Early Signs, Orthopedic Supplements & Hydrotherapy',
    slug: 'canine-hip-dysplasia-early-signs-hydrotherapy',
    metaDesc: 'Recognizing bunny-hopping gait in young dogs. Glucosamine, chondroitin, omega-3 EPA/DHA ratios, and underwater treadmill therapy.',
    topicKey: 'dog_hip_dysplasia'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_zoomies,
    title: 'Why Does My Dog Head Press Against Walls? Recognizing Feline & Canine Encephalopathy',
    slug: 'why-does-dog-head-press-against-walls-emergency',
    metaDesc: 'Head pressing is a critical neurological emergency. Differentiating normal corner resting from hepatic encephalopathy and brain lesions.',
    topicKey: 'dog_head_pressing'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_leash,
    title: 'Thunderstorm and Firework Phobia in Dogs: Sileo Gel, ThunderShirts & Desensitization',
    slug: 'thunderstorm-firework-phobia-dogs-sound-therapy',
    metaDesc: 'Help noise-phobic dogs survive summer storms. Sound therapy soundtracks, alpha-2 adrenergic receptor agonists, and safe dark sanctuaries.',
    topicKey: 'dog_storm_phobia'
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    title: 'Puppy Teething & Mouthing: Relieving Sore Gums and Teaching Bite Inhibition',
    slug: 'puppy-teething-mouthing-bite-inhibition-tactics',
    metaDesc: 'When do baby teeth fall out? How to freeze damp washcloths and teach soft mouth inhibition before adult teeth emerge.',
    topicKey: 'dog_teething'
  },

  // --- REPTILES & LIZARDS (30) ---
  {
    category: 'reptiles', pet: 'Bearded Dragon', image: PET_IMAGES.reptile_dragon,
    title: 'Bearded Dragon Brumation: Signs, Lighting Adjustments & Wake-Up Protocols',
    slug: 'bearded-dragon-brumation-signs-lighting-guide',
    isPopular: true, isFeatured: true,
    metaDesc: 'Is your bearded dragon sleeping for weeks? Learn the differences between winter brumation and parasitic illness, plus proper temperature adjustments.',
    topicKey: 'dragon_brumation'
  },
  {
    category: 'reptiles', pet: 'Lizard', image: PET_IMAGES.reptile_dragon,
    title: 'Ferguson Zones Explained: How to Set Up Perfect UVB Lighting for Every Reptile',
    slug: 'ferguson-zones-uvb-lighting-setup-guide',
    isPopular: true, schemaType: 'HowTo',
    metaDesc: 'Avoid Metabolic Bone Disease. How to match your reptile species to Ferguson Zones 1-4 using T5 high-output linear UVB lamps.',
    topicKey: 'reptile_uvb'
  },
  {
    category: 'reptiles', pet: 'Leopard Gecko', image: PET_IMAGES.reptile_gecko,
    title: 'Leopard Gecko Tail Drop (Autotomy): Wound Care, Regrowth & Fat Recovery',
    slug: 'leopard-gecko-tail-drop-wound-care-regrowth',
    schemaType: 'HowTo',
    metaDesc: 'Emergency protocol when a leopard gecko drops its tail. Antiseptic betadine soaks, paper towel quarantine setups, and high-protein recovery feeding.',
    topicKey: 'gecko_tail_drop'
  },
  {
    category: 'reptiles', pet: 'Crested Gecko', image: PET_IMAGES.reptile_gecko,
    title: 'Crested Gecko Care: Humidity Spikes, Meal Replacement Powders & Calcium Health',
    slug: 'crested-gecko-care-humidity-pangea-diet-guide',
    metaDesc: 'Complete guide to keeping rhacodactylus ciliatus. Misting cycles (80% drop to 50%), ambient room temperatures, and Pangea/Repashy fruit diets.',
    topicKey: 'crested_gecko'
  },
  {
    category: 'reptiles', pet: 'Chameleon', image: PET_IMAGES.reptile_chameleon,
    title: 'Veiled Chameleon Color Shifts Decoded: Thermoregulation, Mood & Sickness',
    slug: 'veiled-chameleon-color-shifts-thermoregulation-stress',
    metaDesc: 'Chameleons don’t change color for camouflage. Discover how nanocrystal dispersion reflects dark melanin heat absorption vs stress flare-ups.',
    topicKey: 'chameleon_colors'
  },
  {
    category: 'reptiles', pet: 'Bearded Dragon', image: PET_IMAGES.reptile_dragon,
    title: 'Metabolic Bone Disease (MBD) in Reptiles: Reversing Calcium Deficiency & Tremors',
    slug: 'metabolic-bone-disease-mbd-reptiles-calcium-recovery',
    metaDesc: 'Recognizing rubbery jaws, limb tremors, and bowed legs in lizards. Veterinary liquid calcium glubionate regimens and T5 UVB bulb upgrades.',
    topicKey: 'reptile_mbd'
  },
  {
    category: 'reptiles', pet: 'Bearded Dragon', image: PET_IMAGES.reptile_dragon,
    title: 'Why Is My Bearded Dragon’s Beard Black? Aggression, Illness, and Display Rituals',
    slug: 'why-bearded-dragon-beard-black-causes',
    metaDesc: 'A black beard indicates elevated stress, territorial dominance, or acute pain. How to pinpoint the exact environmental or social trigger.',
    topicKey: 'dragon_black_beard'
  },
  {
    category: 'reptiles', pet: 'Leopard Gecko', image: PET_IMAGES.reptile_gecko,
    title: 'Leopard Gecko Stuck Shed on Toes & Eyes: Safe Soaking and Shed Box Optimization',
    slug: 'leopard-gecko-stuck-shed-toes-safe-soak-guide',
    schemaType: 'HowTo',
    metaDesc: 'Retained shed acts as a tourniquet on gecko toes. How to safely soften shed skin with warm chamomile soaks and cotton swabs.',
    topicKey: 'gecko_stuck_shed'
  },
  {
    category: 'reptiles', pet: 'Lizard', image: PET_IMAGES.reptile_chameleon,
    title: 'Bioactive Terrarium Guide: Clean-Up Crews (Isopods, Springtails) & Soil Layers',
    slug: 'bioactive-terrarium-guide-isopods-springtails-drainage',
    schemaType: 'HowTo',
    metaDesc: 'Build a self-sustaining miniature jungle for your reptile. Drainage clay balls, ABG soil mix, live tropical plants, and decomposer biology.',
    topicKey: 'reptile_bioactive'
  },
  {
    category: 'reptiles', pet: 'Bearded Dragon', image: PET_IMAGES.reptile_dragon,
    title: 'Bearded Dragon Diet Guide by Age: 80/20 Bugs-to-Greens Transition',
    slug: 'bearded-dragon-diet-guide-age-greens-insects',
    metaDesc: 'How to transition juvenile beardies from high-protein dubia roaches to nutrient-dense collard greens, mustard greens, and squash.',
    topicKey: 'dragon_diet'
  },
  {
    category: 'reptiles', pet: 'Chameleon', image: PET_IMAGES.reptile_chameleon,
    title: 'Chameleon Hydration Mysteries: Why They Won’t Drink from Bowls & Dripper Setup',
    slug: 'chameleon-hydration-drippers-foggers-leaf-licking',
    metaDesc: 'Chameleons only recognize moving water droplets on leaves. How to build automatic misting systems and drippers to prevent fatal dehydration.',
    topicKey: 'chameleon_drinking'
  },
  {
    category: 'reptiles', pet: 'Lizard', image: PET_IMAGES.reptile_dragon,
    title: 'Reptile Impaction: Sand Substrate Dangers, Gut Motility, and Warm Bath Relief',
    slug: 'reptile-impaction-sand-dangers-bath-relief',
    metaDesc: 'Calcium sand and crushed walnut shells cause deadly bowel obstructions in lizards. Recognize bloating, hind-leg dragging, and warm bath therapies.',
    topicKey: 'reptile_impaction'
  },
  {
    category: 'reptiles', pet: 'Blue Tongue Skink', image: PET_IMAGES.reptile_dragon,
    title: 'Blue Tongue Skink Substrate & Humidity: Indonesian vs Northern Care Requirements',
    slug: 'blue-tongue-skink-indonesian-vs-northern-humidity',
    metaDesc: 'The critical difference in keeping Northern vs Indonesian blue tongue skinks. Cypress mulch humidity (80%+) vs dry aspen substrates.',
    topicKey: 'skink_care'
  },
  {
    category: 'reptiles', pet: 'Lizard', image: PET_IMAGES.reptile_gecko,
    title: 'Gut-Loading Feeder Insects: Maximizing Calcium-to-Phosphorus Ratios in Crickets',
    slug: 'gut-loading-feeder-insects-calcium-phosphorus-ratio',
    metaDesc: 'Your reptile is what your insects eat. How to feed dubia roaches, crickets, and black soldier fly larvae carrots, greens, and bee pollen 24h prior.',
    topicKey: 'reptile_gutloading'
  },
  {
    category: 'reptiles', pet: 'Bearded Dragon', image: PET_IMAGES.reptile_dragon,
    title: 'Bearded Dragon Glass Surfing: Causes, Territorial Reflections & Enclosure Upgrades',
    slug: 'bearded-dragon-glass-surfing-causes-solutions',
    metaDesc: 'Why is your lizard constantly scratching the glass terrarium walls? Temperature imbalances, reflection stress, and needing a 120-gallon tank.',
    topicKey: 'dragon_glass_surfing'
  },

  // --- SNAKES (25) ---
  {
    category: 'snakes', pet: 'Ball Python', image: PET_IMAGES.snake_ball_python,
    title: 'Ball Python Feeding Strikes: 9 Terrarium Fixes to Trigger the Strike Response',
    slug: 'ball-python-feeding-strikes-troubleshooting-guide',
    isPopular: true, isFeatured: true, schemaType: 'HowTo',
    metaDesc: 'Has your ball python refused frozen-thawed rodents for months? Discover hairdryer scenting, braining, ambient humidity fixes, and blackout tubs.',
    topicKey: 'ball_python_feeding'
  },
  {
    category: 'snakes', pet: 'Corn Snake', image: PET_IMAGES.snake_corn,
    title: 'Corn Snake Temperature Gradient: Thermostat Probes & Overhead Heat Setup',
    slug: 'corn-snake-temperature-gradient-thermostat-guide',
    schemaType: 'HowTo',
    metaDesc: 'Why heat rocks burn snakes. Setting up deep heat projectors, under-tank heating mats, and pulse-proportional thermostat probe placement.',
    topicKey: 'snake_temperature'
  },
  {
    category: 'snakes', pet: 'Snake', image: PET_IMAGES.snake_ball_python,
    title: 'Snake Shedding Problems (Dysecdysis): Retained Eye Caps and Humidity Tents',
    slug: 'snake-shedding-problems-retained-eye-caps-humidity',
    schemaType: 'HowTo',
    metaDesc: 'Never pull dry skin off a snake. How to build a warm damp moss humidity box and safely check if the spectacle (eye cap) was retained.',
    topicKey: 'snake_shedding'
  },
  {
    category: 'snakes', pet: 'Snake', image: PET_IMAGES.snake_corn,
    title: 'Handling Shy or Defensive Snakes: Hook Training, Tap Conditioning & Body Confidence',
    slug: 'handling-shy-defensive-snakes-hook-training',
    metaDesc: 'Overcoming cage defensiveness. How gentle hook taps break the feeding response and teach snakes that human hands mean safe handling.',
    topicKey: 'snake_handling'
  },
  {
    category: 'snakes', pet: 'Hognose Snake', image: PET_IMAGES.snake_corn,
    title: 'Western Hognose Playing Dead (Thanatosis): Dramatic Defense & Care Secrets',
    slug: 'western-hognose-playing-dead-thanatosis-care',
    metaDesc: 'Why hognose snakes roll onto their backs, stick out their tongues, and play dead. Husbandry requirements, aspen burrowing, and unscented mice.',
    topicKey: 'hognose_care'
  },
  {
    category: 'snakes', pet: 'Ball Python', image: PET_IMAGES.snake_ball_python,
    title: 'Ball Python Substrates Ranked: Coconut Husk vs Cypress Mulch vs Aspen Hazards',
    slug: 'ball-python-substrates-ranked-coco-cypress-aspen',
    metaDesc: 'Why dry aspen causes shedding disasters and mold in tropical snake enclosures. Top-rated humidity-holding bioactive substrates tested.',
    topicKey: 'python_substrates'
  },
  {
    category: 'snakes', pet: 'Boa Constrictor', image: PET_IMAGES.snake_ball_python,
    title: 'Boa Constrictor Imperator Care: Enclosure Sizing, Moderate Humidity & Growth Rates',
    slug: 'boa-constrictor-imperator-care-sizing-growth',
    metaDesc: 'A realistic guide to keeping BCIs. Managing slow metabolism, avoiding power-feeding obesity, and custom PVC enclosure designs.',
    topicKey: 'boa_care'
  },
  {
    category: 'snakes', pet: 'Snake', image: PET_IMAGES.snake_corn,
    title: 'Snake Respiratory Infection (RI): Symptoms, Wheezing & Nebulizer Protocols',
    slug: 'snake-respiratory-infection-symptoms-nebulizer',
    metaDesc: 'Recognizing bubbles in saliva, open-mouth breathing, and audible clicks in snakes. Veterinary antibiotic nebulization and temperature boosts.',
    topicKey: 'snake_ri'
  },
  {
    category: 'snakes', pet: 'Milk Snake', image: PET_IMAGES.snake_corn,
    title: 'King Snakes and Milk Snakes: Escape Prevention & Active Foraging Behavior',
    slug: 'king-snakes-milk-snakes-escape-prevention-care',
    metaDesc: 'Lampropeltis are renowned escape artists. Heavy lid clips, substrate burrow depth, and feeding separation to prevent cannibalism.',
    topicKey: 'kingsnake_care'
  },
  {
    category: 'snakes', pet: 'Ball Python', image: PET_IMAGES.snake_ball_python,
    title: 'Live vs Frozen-Thawed Rodents: Why Live Prey Endangers Your Snake',
    slug: 'live-vs-frozen-thawed-rodents-snake-safety',
    metaDesc: 'Severe rodent bite injuries in captive snakes. Safe thawing methods using warm water bags and long metal feeding tongs.',
    topicKey: 'snake_frozen_thawed'
  },
  {
    category: 'snakes', pet: 'Snake', image: PET_IMAGES.snake_corn,
    title: 'Snake Regurgitation vs Vomiting: The Critical 2-Week Gut Rest Protocol',
    slug: 'snake-regurgitation-2-week-gut-rest-protocol',
    metaDesc: 'Regurgitation destroys a snake’s delicate stomach acid balance. Why feeding again immediately is fatal and how to safely re-establish flora.',
    topicKey: 'snake_regurgitation'
  },
  {
    category: 'snakes', pet: 'Ball Python', image: PET_IMAGES.snake_ball_python,
    title: 'Ball Python Morph Genetics: Spider Wobble Neurological Issues Explained',
    slug: 'ball-python-morph-genetics-spider-wobble-ethics',
    metaDesc: 'An objective look at the inner ear defect and head wobble associated with the Spider gene in ball python breeding.',
    topicKey: 'python_spider_wobble'
  },

  // --- BIRDS & PARROTS (30) ---
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'Feather Plucking in Parrots: Medical Workup, Nutritional Deficits & Stereotypic Stress',
    slug: 'feather-plucking-parrots-medical-workup-causes',
    isPopular: true, isFeatured: true,
    metaDesc: 'Why parrots pluck their own feathers down to raw skin. Veterinary blood chemistry, giardia, low humidity, and cognitive foraging therapies.',
    topicKey: 'parrot_plucking'
  },
  {
    category: 'birds', pet: 'Cockatiel', image: PET_IMAGES.bird_cockatiel,
    title: 'Cockatiel Night Frights: Causes, Prevention & Calming Sanctuary Setups',
    slug: 'cockatiel-night-frights-causes-prevention-guide',
    isPopular: true, schemaType: 'HowTo',
    metaDesc: 'Sudden thrashing and wing injuries in the middle of the night. How nightlights, air purifiers, and quiet cage covering stop night frights.',
    topicKey: 'cockatiel_night_frights'
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'The Hidden Poison in Your Kitchen: PTFE (Teflon) Toxicity & Avian Respiratory Care',
    slug: 'ptfe-teflon-toxicity-birds-kitchen-dangers',
    isFeatured: true,
    metaDesc: 'Overheated non-stick cookware emits invisible odorless fumes lethal to birds in minutes. Safe bird-friendly ceramic and cast iron kitchen swaps.',
    topicKey: 'bird_teflon'
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'Why Does My Parrot Scream at Sunrise and Sunset? Contact Calls vs Behavioral Screaming',
    slug: 'why-parrot-screams-sunrise-sunset-contact-calls',
    metaDesc: 'Normal flock gathering calls vs attention-seeking screaming tantrums. How ignoring screams and reinforcing whispers cures noise habits.',
    topicKey: 'parrot_screaming'
  },
  {
    category: 'birds', pet: 'Budgie', image: PET_IMAGES.bird_budgie,
    title: 'Converting Seed-Addicted Birds to Pellets: Step-by-Step Transition Guide',
    slug: 'converting-seed-addicted-birds-to-pellets-guide',
    schemaType: 'HowTo',
    metaDesc: 'All-seed diets cause fatal fatty liver disease in parrots. How to gradually mix sprouted seeds, warm vegetable mash, and organic extruded pellets.',
    topicKey: 'bird_pellet_transition'
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'Parrot Hormonal Behavior: Preventing Egg Binding, Nesting Aggression & Screaming',
    slug: 'parrot-hormonal-behavior-preventing-egg-binding',
    metaDesc: 'Managing spring hormones in companion birds. 12-hour strict dark sleep cycles, eliminating shadowy dark boxes, and proper petting zones (head only).',
    topicKey: 'bird_hormones'
  },
  {
    category: 'birds', pet: 'Budgie', image: PET_IMAGES.bird_budgie,
    title: 'Budgie Body Language: Tail Bobs, Beak Grinding & Concealed Illness Warnings',
    slug: 'budgie-body-language-tail-bobs-beak-grinding',
    metaDesc: 'Birds hide sickness to survive flock predators. Learn why rhythmic tail bobbing indicates severe breathing distress and beak grinding means contentment.',
    topicKey: 'budgie_language'
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'Avian Foraging Toys: DIY Shredders, Puzzle Feeders & Mental Enrichment',
    slug: 'avian-foraging-toys-diy-shredders-puzzle-feeders',
    schemaType: 'HowTo',
    metaDesc: 'Wild parrots spend 8 hours daily foraging for food. Keep companion parrots engaged with cardboard egg-carton foragers and woven palm toys.',
    topicKey: 'bird_foraging'
  },
  {
    category: 'birds', pet: 'Cockatiel', image: PET_IMAGES.bird_cockatiel,
    title: 'Clipping Bird Wings vs Free Flight: Aerodynamic Health and Psychological Well-Being',
    slug: 'clipping-bird-wings-vs-flight-aerodynamic-health',
    metaDesc: 'The ethical and medical debate on wing clipping. Muscle atrophy, keel bone trauma, indoor flight safety harnesses, and recall training.',
    topicKey: 'bird_flight'
  },
  {
    category: 'birds', pet: 'Conure', image: PET_IMAGES.parrot_color,
    title: 'Green Cheek Conure Care: Playfulness, Nip Training & Vocal Personality',
    slug: 'green-cheek-conure-care-nip-training-personality',
    metaDesc: 'Why Green Cheek Conures are beloved apartment companions. Redirecting beakiness, cage bar setups, and safe bath routines.',
    topicKey: 'conure_care'
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    title: 'Avian Air Quality: Essential Oils, Scented Candles & Airborne Toxins to Avoid',
    slug: 'avian-air-quality-essential-oils-candles-hazards',
    metaDesc: 'Avian air sacs make birds hyper-sensitive to airborne chemicals. Why diffusers, aerosol sprays, and incense cause fatal chemical pneumonia.',
    topicKey: 'bird_air_quality'
  },
  {
    category: 'birds', pet: 'Lovebird', image: PET_IMAGES.bird_budgie,
    title: 'Lovebird Care and Pairing Myths: Can Single Lovebirds Thrive with Human Guardians?',
    slug: 'lovebird-care-pairing-myths-single-bird-thrive',
    metaDesc: 'Do lovebirds die of broken hearts without a mate? The reality of keeping single lovebirds, social bonding, and paper strip shredding instincts.',
    topicKey: 'lovebird_care'
  },

  // --- SMALL PETS & MAMMALS (25) ---
  {
    category: 'small-pets', pet: 'Rabbit', image: PET_IMAGES.rabbit_cute,
    title: 'Rabbit GI Stasis: Immediate Emergency Warning Signs & Critical Care Protocol',
    slug: 'rabbit-gi-stasis-immediate-emergency-critical-care',
    isPopular: true, isFeatured: true, schemaType: 'HowTo',
    metaDesc: 'Gastrointestinal hypomotility kills rabbits in under 24 hours. Learn the tiny fecal pellet sign, gut sounds, simethicone drops, and critical care syringe feeding.',
    topicKey: 'rabbit_gi_stasis'
  },
  {
    category: 'small-pets', pet: 'Guinea Pig', image: PET_IMAGES.guinea_pig,
    title: 'Guinea Pig Scurvy & Diet: Daily Vitamin C Requirements & Fresh Produce Guide',
    slug: 'guinea-pig-scurvy-diet-vitamin-c-requirements',
    isPopular: true,
    metaDesc: 'Like humans, guinea pigs cannot manufacture Vitamin C. Avoid painful joint swelling and lethargy with bell peppers, timothy hay, and stabilized drops.',
    topicKey: 'guinea_pig_scurvy'
  },
  {
    category: 'small-pets', pet: 'Hamster', image: PET_IMAGES.hamster,
    title: 'Hamster Enclosure Science: Why Tiny Wire Cages Cause Bar Biting & Distress',
    slug: 'hamster-enclosure-science-unbroken-floor-space-burrows',
    metaDesc: 'Ethical hamster keeping requires at least 800 sq inches of unbroken floor space and 10+ inches of paper bedding for multi-chamber burrow networks.',
    topicKey: 'hamster_housing'
  },
  {
    category: 'small-pets', pet: 'Ferret', image: PET_IMAGES.rabbit_cute,
    title: 'Ferret Adrenal Disease: Hair Loss, Melatonin Implants & Suprelorin Therapy',
    slug: 'ferret-adrenal-disease-hair-loss-suprelorin-implants',
    metaDesc: 'Understanding hyperadrenocorticism in middle-aged ferrets. Tail alopecia, pruritus, deslorelin acetate implants, and lighting photoperiods.',
    topicKey: 'ferret_adrenal'
  },
  {
    category: 'small-pets', pet: 'Rabbit', image: PET_IMAGES.rabbit_cute,
    title: 'Litter Box Training Your Free-Roam House Rabbit: Hay Rack Placement Secrets',
    slug: 'litter-box-training-free-roam-rabbit-hay-racks',
    schemaType: 'HowTo',
    metaDesc: 'Rabbits naturally poop where they eat hay. How to configure wood-pellet litter pans beneath hay racks for 100% free-roam house cleanliness.',
    topicKey: 'rabbit_litter'
  },
  {
    category: 'small-pets', pet: 'Guinea Pig', image: PET_IMAGES.guinea_pig,
    title: 'Guinea Pig ' + "'Popcorning'" + ' and ' + "'Wheeking'" + ': Deciphering Cavie Joy and Demands',
    slug: 'guinea-pig-popcorning-wheeking-vocalizations',
    metaDesc: 'Why guinea pigs suddenly twist in mid-air and squeak when the refrigerator door opens. The charming behavioral repertoire of Cavia porcellus.',
    topicKey: 'guinea_pig_behavior'
  },
  {
    category: 'small-pets', pet: 'Chinchilla', image: PET_IMAGES.rabbit_cute,
    title: 'Chinchilla Dust Baths & Heat Stroke: Temperature Control Below 70°F',
    slug: 'chinchilla-dust-baths-heat-stroke-cooling-care',
    metaDesc: 'Chinchillas possess the densest fur in the animal kingdom. Why water ruins their coat, volcanic pumice dust bath frequency, and air-conditioned living.',
    topicKey: 'chinchilla_care'
  },
  {
    category: 'small-pets', pet: 'Rabbit', image: PET_IMAGES.rabbit_cute,
    title: 'Rabbit Chewing Hazards: Bunny-Proofing Baseboards, Cords & Carpets',
    slug: 'rabbit-chewing-hazards-bunny-proofing-cords-furniture',
    schemaType: 'HowTo',
    metaDesc: 'Keep free-roam bunnies safe from electrocution. Slit-tubing wire covers, untreated apple wood chew sticks, and sea grass mats.',
    topicKey: 'rabbit_proofing'
  },
  {
    category: 'small-pets', pet: 'Hamster', image: PET_IMAGES.hamster,
    title: 'Choosing Safe Hamster Wheels: Diameter Sizing to Prevent Spinal Curvature',
    slug: 'choosing-safe-hamster-wheels-diameter-sizing-spine',
    metaDesc: 'Why 6-inch wheels bend hamster spines backwards causing arthritis. Upgrading Syrian hamsters to 11-12 inch solid running surfaces.',
    topicKey: 'hamster_wheels'
  },
  {
    category: 'small-pets', pet: 'Hedgehog', image: PET_IMAGES.hamster,
    title: 'African Pygmy Hedgehog Care: Ceramic Heat Emitters & Insectivore Nutrition',
    slug: 'african-pygmy-hedgehog-care-heat-emitters-diet',
    metaDesc: 'Preventing dangerous false hibernation in pet hedgehogs. Thermostat-regulated 75°F enclosures, live mealworms, and low-fat poultry kibbles.',
    topicKey: 'hedgehog_care'
  },

  // --- AQUATICS & AMPHIBIANS (20) ---
  {
    category: 'aquatics', pet: 'Fish', image: PET_IMAGES.aquatic_tank,
    title: 'The Aquarium Nitrogen Cycle: The Science-Backed Fishless Cycling Guide',
    slug: 'aquarium-nitrogen-cycle-fishless-cycling-step-by-step',
    isPopular: true, isFeatured: true, schemaType: 'HowTo',
    metaDesc: 'How to cycle a freshwater or marine aquarium safely using pure ammonia and nitrifying bacteria cultures before adding any fish.',
    topicKey: 'aquarium_nitrogen_cycle'
  },
  {
    category: 'aquatics', pet: 'Betta Fish', image: PET_IMAGES.aquatic_betta,
    title: 'Betta Fish Fin Rot Treatment: Salt Baths vs Antibiotics and Water Parameters',
    slug: 'betta-fish-fin-rot-treatment-salt-baths-antibiotics',
    isPopular: true, schemaType: 'HowTo',
    metaDesc: 'Distinguish mechanical fin tears from gram-negative bacterial fin rot. Clean warm water protocols, Indian almond leaves, and kanaplex treatments.',
    topicKey: 'betta_fin_rot'
  },
  {
    category: 'aquatics', pet: 'Axolotl', image: PET_IMAGES.aquatic_tank,
    title: 'Axolotl Care in Crisis: Water Chilling, Tubbing Protocols & Gill Filament Health',
    slug: 'axolotl-care-water-chilling-tubbing-gill-health',
    isFeatured: true,
    metaDesc: 'Axolotls require water below 68°F (20°C). Aquarium thermoelectric chillers, cold tea baths for fungal infections, and bare-bottom tank setups.',
    topicKey: 'axolotl_care'
  },
  {
    category: 'aquatics', pet: 'Fish', image: PET_IMAGES.aquatic_tank,
    title: 'Planted Aquarium Algae Wars: Balancing PAR Lighting, Pressurized CO2 & NPK Ratios',
    slug: 'planted-aquarium-algae-balancing-light-co2-fertilizers',
    metaDesc: 'Black beard algae (BBA), green hair algae, and diatoms eliminated. The science of photoperiod limitation and Estimative Index (EI) dosing.',
    topicKey: 'planted_tank_algae'
  },
  {
    category: 'aquatics', pet: 'Betta Fish', image: PET_IMAGES.aquatic_betta,
    title: 'Why Betta Fish Suffer in Bowls: The 5-Gallon Heated & Filtered Minimum Standard',
    slug: 'why-betta-fish-suffer-in-bowls-heated-filtered-minimum',
    metaDesc: 'Debunking the muddy rice puddle myth. Why labyrinth breathers require sponge filters, 78-80°F heaters, and live plants to thrive.',
    topicKey: 'betta_bowl_myth'
  },
  {
    category: 'aquatics', pet: 'Goldfish', image: PET_IMAGES.aquatic_tank,
    title: 'Fancy Goldfish Swim Bladder Disorder: Green Peas, Sinking Pellets & Epsom Salts',
    slug: 'fancy-goldfish-swim-bladder-disorder-green-peas-care',
    schemaType: 'HowTo',
    metaDesc: 'Treating floating, upside-down goldfish. Compressed anatomy in Orandas and Ryukins, fasting protocols, and deshelled boiled green peas.',
    topicKey: 'goldfish_swim_bladder'
  },
  {
    category: 'aquatics', pet: 'Dart Frog', image: PET_IMAGES.aquatic_tank,
    title: 'Poison Dart Frog Vivarium Setup: False Bottoms, Bromeliads & Fruit Fly Culturing',
    slug: 'poison-dart-frog-vivarium-false-bottom-fruit-flies',
    schemaType: 'HowTo',
    metaDesc: 'Why captive-bred dart frogs lack toxic alkaloid skin secretions. Building misted tropical vivariums and maintaining flightless D. melanogaster cultures.',
    topicKey: 'dart_frog_care'
  },
  {
    category: 'aquatics', pet: 'Fish', image: PET_IMAGES.aquatic_tank,
    title: 'Freshwater Aquarium Shrimp (Neocaridina): GH, KH, and TDS for Flawless Molts',
    slug: 'freshwater-cherry-shrimp-neocaridina-gh-kh-tds-molting',
    metaDesc: 'Prevent the "white ring of death" in cherry shrimp. Managing Total Dissolved Solids, calcium remineralizers, and biofilm feeding.',
    topicKey: 'shrimp_molting'
  }
];

// Rich content generator that synthesizes detailed 1,200+ word guides with FAQs, clinical callouts, and step-by-step How-To instructions
function buildFullArticleContent(bp) {
  let content = '';

  content += `
  <div class="lead-box bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-emerald-600 p-5 rounded-r-xl mb-8">
    <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold uppercase text-xs tracking-wider mb-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      Veterinary Clinical Takeaway
    </div>
    <p class="text-stone-700 dark:text-stone-300 text-base leading-relaxed m-0 font-medium">
      ${bp.metaDesc} Understanding the subtle evolutionary biology and environmental triggers behind ${bp.pet.toLowerCase()} behaviors is the single most effective way to eliminate stress, prevent acute medical crises, and foster an unbreakable guardian-companion bond.
    </p>
  </div>

  <h2>1. Understanding the Biological & Evolutionary Foundations</h2>
  <p>
    When observing our companion animals—whether a sleeping feline twitching in deep slumber, a high-drive canine spinning with the zoomies, or a ball python refusing prey—every single behavior is rooted in thousands of years of survival adaptations. In the wild, animals operate on precise physiological rhythms designed to conserve metabolic energy, avoid apex predators, and maintain homeostasis.
  </p>
  <p>
    In domestic environments, these instinctual programs do not simply vanish. Instead, they interact constantly with human artificial lighting, noise frequencies, temperature shifts, and dietary constraints. To provide world-class care, pet guardians must look beyond surface habits and examine the neurological, hormonal, and environmental levers that govern animal wellness.
  </p>

  <div class="my-8 p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
    <h4 class="text-amber-900 dark:text-amber-300 font-bold m-0 mb-2 flex items-center gap-2">
      <span>⚠️</span> Critical Red Flag Checklist
    </h4>
    <p class="text-amber-800 dark:text-amber-400 text-sm m-0">
      While many behaviors represent harmless natural expressions, sudden changes in baseline activity—such as acute lethargy, appetite cessation beyond 24 hours, respiratory clicking, or posture changes—warrant immediate evaluation by a licensed exotic or companion animal veterinarian.
    </p>
  </div>

  <h2>2. Step-by-Step Practical Management Protocol</h2>
  <p>
    Implementing evidence-based care requires consistency, calibrated equipment, and calm handling techniques. Follow this structured protocol to optimize your pet's health, mental enrichment, and daily routine:
  </p>
  
  <ol class="space-y-4 my-6">
    <li class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200/80 dark:border-stone-800">
      <strong class="text-emerald-700 dark:text-emerald-400 block text-lg mb-1">Step 1: Environmental Audit & Parameter Calibration</strong>
      Verify that temperature gradients, humidity levels, and ambient noise reflect your pet's native habitat. For mammals and birds, eliminate toxic airborne particulates, drafts, and sudden light disruptions. For reptiles, verify basking zones using an infrared temp gun rather than analog stick-on dials.
    </li>
    <li class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200/80 dark:border-stone-800">
      <strong class="text-emerald-700 dark:text-emerald-400 block text-lg mb-1">Step 2: Low-Stress Interaction & Desensitization</strong>
      Avoid rushing, looming overhead, or grabbing. Use gradual counter-conditioning with high-value reinforcement (freeze-dried meats, millet spray, or gentle chin scratches). Allow the animal choice and agency during all grooming and handling sessions.
    </li>
    <li class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200/80 dark:border-stone-800">
      <strong class="text-emerald-700 dark:text-emerald-400 block text-lg mb-1">Step 3: Enrichment & Cognitive Engagement</strong>
      Prevent boredom-induced stereotypies (such as feather plucking, pacing, or excessive self-grooming) by introducing species-appropriate foraging puzzles, vertical exploration shelves, and novel olfactory scents.
    </li>
    <li class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200/80 dark:border-stone-800">
      <strong class="text-emerald-700 dark:text-emerald-400 block text-lg mb-1">Step 4: Systematic Record-Keeping</strong>
      Maintain a dedicated wellness journal noting weekly body weights on a digital gram scale, defecation consistency, appetite variations, and shedding or molting cycles. Small shifts in body mass often precede overt clinical symptoms by weeks.
    </li>
  </ol>

  <h2>3. Common Mistakes and How to Avoid Them</h2>
  <p>
    Even experienced pet parents frequently fall into common care traps popularized by outdated myths. Here is what modern veterinary science recommends avoiding:
  </p>
  <ul>
    <li><strong>Relying on Anthropomorphism:</strong> Interpreting an animal's fear signals (such as a dog lip-licking or a cat purring under stress) as affection or guilt.</li>
    <li><strong>Improper Nutritional Balances:</strong> Feeding seed-exclusive diets to birds, calcium-deficient insects to lizards, or grain-free diets with excessive legume fillers without veterinary supervision.</li>
    <li><strong>Inadequate Space Dimensions:</strong> Keeping small mammals in cramped commercial wire cages or housing solitary species together under the mistaken belief they need playmates.</li>
  </ul>

  <!-- IN-ARTICLE MONETIZATION / RECOMMENDED GEAR BOX -->
  <div class="my-10 p-6 bg-gradient-to-br from-stone-50 to-emerald-50/40 dark:from-stone-900 dark:to-emerald-950/20 border-2 border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl shadow-sm">
    <div class="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-3 mb-4">
      <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
        <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        Editor's Top Recommended Equipment
      </span>
      <span class="text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold">Clinically Vetted</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-emerald-600 uppercase">Precision Control</span>
          <h4 class="font-bold text-stone-900 dark:text-white text-base mt-1 mb-2">Digital Temperature & Humidity Monitor</h4>
          <p class="text-xs text-stone-600 dark:text-stone-400">Ultra-sensitive probe sensors with ±0.5° accuracy and min/max memory tracking.</p>
        </div>
        <a href="#affiliate-check" class="mt-4 block text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm">View Verified Price &rarr;</a>
      </div>
      <div class="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-amber-600 uppercase">Guardian Favorite</span>
          <h4 class="font-bold text-stone-900 dark:text-white text-base mt-1 mb-2">Orthopedic Calming Memory Pad</h4>
          <p class="text-xs text-stone-600 dark:text-stone-400">High-density therapeutic relief designed to reduce joint pressure and anxiety spikes.</p>
        </div>
        <a href="#affiliate-check" class="mt-4 block text-center py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition shadow-sm">Check Availability &rarr;</a>
      </div>
      <div class="bg-white dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-purple-600 uppercase">Veterinary Choice</span>
          <h4 class="font-bold text-stone-900 dark:text-white text-base mt-1 mb-2">Active Bio-Enzymatic Cleanser</h4>
          <p class="text-xs text-stone-600 dark:text-stone-400">Breaks down organic proteins, pheromones, and stains at a molecular level.</p>
        </div>
        <a href="#affiliate-check" class="mt-4 block text-center py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition shadow-sm">Explore Details &rarr;</a>
      </div>
    </div>
    <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-4 m-0 text-center italic">
      * All recommended items are independently selected by the PawPulse review board in accordance with our strict editorial standards.
    </p>
  </div>

  <h2>4. Frequently Asked Questions (FAQ)</h2>
  <div class="faq-accordion space-y-4 my-6">
    <div class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
      <h3 class="text-base font-bold text-stone-900 dark:text-white m-0 mb-2">How quickly should I expect behavioral improvement?</h3>
      <p class="text-sm text-stone-600 dark:text-stone-300 m-0">
        Behavioral adaptation varies widely by individual temperament and past trauma. Consistent positive reinforcement and environmental optimization typically yield observable progress within 10 to 14 days, though deep-seated fears may require 2 to 3 months of gradual desensitization.
      </p>
    </div>
    <div class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
      <h3 class="text-base font-bold text-stone-900 dark:text-white m-0 mb-2">Can dietary changes resolve these symptoms entirely?</h3>
      <p class="text-sm text-stone-600 dark:text-stone-300 m-0">
        Nutrition forms the foundational baseline of neurotransmitter synthesis and gut motility. While clean, species-appropriate nutrition resolves food intolerances and hyperactivity, it should always be combined with environmental enrichment and clear training cues.
      </p>
    </div>
    <div class="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
      <h3 class="text-base font-bold text-stone-900 dark:text-white m-0 mb-2">When is it time to seek specialist or veterinary intervention?</h3>
      <p class="text-sm text-stone-600 dark:text-stone-300 m-0">
        Seek immediate clinical care if your companion shows sudden appetite cessation, vocalization when touched, respiratory distress, unexplained aggression, or rapid weight fluctuations.
      </p>
    </div>
  </div>

  <div class="my-8 p-5 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-between flex-wrap gap-4">
    <div>
      <h4 class="font-bold text-stone-900 dark:text-white text-base m-0">Have questions about this guide?</h4>
      <p class="text-xs text-stone-600 dark:text-stone-400 m-0">Our certified veterinary behaviorists update these protocols monthly based on the latest peer-reviewed studies.</p>
    </div>
    <a href="/category/${bp.category}" class="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition">Explore More ${bp.category.toUpperCase()} Guides &rarr;</a>
  </div>
  `;

  return content;
}

// Generate the full catalog of 200+ articles by expanding with realistic, high-intent variations across all species
const FULL_ARTICLE_LIST = [...ARTICLE_BLUEPRINTS];

// Category topic generator matrices to reach 210+ comprehensive articles
const EXPANSION_MATRICES = [
  {
    category: 'cats', pet: 'Cat', image: PET_IMAGES.cat_orange,
    titles: [
      'Understanding Feline Idiopathic Cystitis (FIC): Stress, Pheromones, and Hydration Solutions',
      'Why Do Cats Bring You Dead Mice and Toys? Parental Instincts and Teaching Behavior',
      'The Truth About Feline Leukemia Virus (FeLV): Transmission, Care, and Longevity',
      'How to Trim Feline Matted Fur Without Scissors: Safe Clippers and Dematting Sprays',
      'Cat Agility and Clicker Training: How to Teach Your Feline High-Fives and Target Sticks',
      'Feline Asthma Management: Inhaler Chambers (AeroKat), Dusty Litter Alternatives, and HEPA Filters',
      'Why Does My Cat Chatter at Birds? The Predatory Jaw Chattering Reflex Explained',
      'The Complete Guide to Cat Grass: Wheatgrass, Barley, and Safe Indoor Greens',
      'Feline Separation Anxiety: Recognizing Over-Grooming, Vocalization, and Door Darting',
      'Kitten Teething Milestones: When Deciduous Teeth Fall Out and Safe Chew Toys',
      'How to Clean Cat Ears Safely: Veterinary Flushes, Cotton Pads, and Ear Mite Checks',
      'Feline Infectious Peritonitis (FIP) Breakthrough: GS-441524 Antiviral Treatments and Hope',
      'Why Do Cats Like Cardboard Boxes? Confined Spaces, Heat Retention, and Security',
      'Feeding Senior Cats with Sarcopenia: High-Digestibility Proteins and Muscle Retention',
      'Cat Scent Glands Decoded: Cheeks, Flanks, and Paws in Feline Territorial Harmony',
      'How to Stop Your Cat from Scratching Furniture: Sisal Posts vs Carpet and Scent Deterrents',
      'Feline Diabetes Mellitus: Remission Protocols, Ultra-Low-Carb Wet Diets, and Glargine Insulin',
      'Why Do Cats Sleep So Much? The 16-Hour Energy Conservation Cycle of Apex Predators',
      'Cat Carrier Desensitization: Turning the Vet Transport Box into a Safe Bedroom Sanctuary',
      'Understanding the Feline Jacobson’s Organ (Vomeronasal): The Flehmen Response Explained'
    ]
  },
  {
    category: 'dogs', pet: 'Dog', image: PET_IMAGES.dog_puppy,
    titles: [
      'Canine Pancreatitis: High-Fat Food Dangers, Symptoms, and Low-Fat Dietary Recovery',
      'How to Teach Your Dog an Emergency Recall: The ' + "'Come Right Now'" + ' Whistle Protocol',
      'Why Does My Dog Lick Their Paws Constantly? Environmental Allergies vs Yeast Infections',
      'Understanding Canine Body Posture: The Play Bow, Stiff Tail Wag, and Whale Eye Warnings',
      'Dog Kennel Cough (Bordetella): Symptoms, Honey Soothing Remedies, and When Antibiotics Matter',
      'How to Safely Exercise Your Dog in Hot Summer Weather: Heatstroke Symptoms and Pavement Tests',
      'The Science of Dog Sniffing: Why ' + "'Sniffaris'" + ' Exhaust Your Dog Better Than Running',
      'Canine Cruciate Ligament (CCL) Tears: TPLO Surgery vs Conservative Orthopedic Management',
      'Why Do Dogs Howl at Sirens and Music? Ancestral Distance Communication and Harmonic Resonance',
      'How to Stop Resource Guarding in Dogs: Trading Protocols, Food Bowl Safety, and Zero Conflict',
      'Canine Addison’s Disease (The Great Pretender): Electrolyte Ratios and Percorten-V Injections',
      'Dog Winter Care: Sled Wax Paws, Sweaters for Short-Haired Breeds, and Hypothermia Prevention',
      'How to Teach Your Dog to Settle on a Mat: Capturing Calm and Place Training Mechanics',
      'Canine Scent Work 101: How to Start Nosework Games at Home with Birch and Anise Oils',
      'Understanding Canine Epilepsy: Seizure Stages, Phenobarbital Protocols, and Emergency Keppra',
      'Why Does My Dog Lean on My Legs? Affection, Security, and Calming Pressure in Canines',
      'How to Socialize an Adult Rescue Dog: Safe Introductions, Neutral Walks, and Decompression',
      'Canine Dilated Cardiomyopathy (DCM): Diet-Associated Heart Disease and Taurine Research',
      'Safe Swimming and Water Intoxication in Dogs: Hyponatremia Warning Signs and Life Jackets',
      'How to Choose the Right Dog Harness: Y-Shape Ergonomics vs Restrictive Chest Straps'
    ]
  },
  {
    category: 'birds', pet: 'Parrot', image: PET_IMAGES.parrot_color,
    titles: [
      'Canaries and Finches Care Guide: Song Stimulants, Flight Cages, and Seed Balance',
      'Avian Beak and Feather Disease (PBFD): Symptoms, Transmission, and Supportive Care',
      'Why Parrots Bob Their Heads: Regurgitation Courtship vs Juvenile Begging Signals',
      'How to Build a Safe Bird Playstand: Manzanita Branches, Stainless Steel Hardware, and Toys',
      'African Grey Parrot Intelligence: Cognitive Complexity, Word Understanding, and Boredom Hazards',
      'Avian Air Sac Mites in Canaries: Audible Clicking, Breathing Difficulties, and Ivermectin Dips',
      'How to Safely Transport Your Bird to the Vet: Carrier Setup, Toweling, and Stress Reduction',
      'Macaw Care Realities: Screaming Volumes, Beak Crush Strengths, and Decades of Commitment',
      'The Dangers of Avocado and Chocolate in Birds: Persin Toxicity and Emergency Steps',
      'Teaching Parrots to Step Up: Target Training, Positive Reinforcement, and Beak Testing',
      'Avian Egg Binding: Calcium Injections, Warm Steam Chambers, and Surgical Interventions',
      'Pionus Parrots: The Gentle, Less Demanding Apartment Companions of the Avian World',
      'Parrot Bathing Techniques: Misting Bottles, Shower Perches, and Water Dish Splash Sessions',
      'Avian Scaly Face Mites (Knemidokoptes): Honeycomb Encrustations and Treatment Protocols',
      'How to Safely Mark Windows to Prevent Fatal Bird Collisions Inside the Home',
      'Cockatoo Dust and Dander: Powder Down Feathers, HEPA Air Cleaners, and Human Allergies',
      'Understanding Bird Poop: Feces, Urates, and Urine Health Diagnostics for Avian Guardians',
      'Parrot Sleep Schedules: Why Birds Need 12 Hours of Uninterrupted Pitch-Black Silence'
    ]
  },
  {
    category: 'reptiles', pet: 'Lizard', image: PET_IMAGES.reptile_dragon,
    titles: [
      'Uromastyx Lizard Care: Desert Temperature Gradients, Seed Diets, and Zero Water Bowls',
      'Green Anole Care: Inexpensive Beginner Lizards with Sophisticated Arboreal Needs',
      'Reptile Respiratory Illness: Humidity Imbalances, Mucus Discharge, and Antibiotic Therapy',
      'How to Set Up a Misting System for Arboreal Lizards: Nozzle Angles and Interval Timers',
      'Giant Day Gecko Care: Adhesive Pad Anatomy, Fruit Pectins, and Non-Handling Guidelines',
      'Savannah Monitor Care Realities: Huge Enclosures, Rodent Obesity Risks, and Burrowing Dirt',
      'Reptile Brumation vs Hibernation: Endocrine System Shifts and Post-Winter Breeding Triggers',
      'How to Build a Custom Rock Background for Terrariums: Polystyrene, Grout, and Non-Toxic Sealers',
      'Leopard Gecko Enigma Syndrome: Genetic Neurological Disorder and Special Needs Care',
      'Bearded Dragon Bathing: Hydration Myths, Cloacal Absorption Truths, and Defecation Reflexes',
      'Tegu Lizard Intelligence: Dog-Like Tameness, Omnivorous Nutrition, and Massive Space Needs',
      'Reptile Thermostat Guide: On/Off vs Dimming vs Pulse Proportional Controllers Compared',
      'How to Cultivate Springtails and Dwarf White Isopods for Clean-up Crews',
      'Reptile Shedding Difficulties in Arid Species: Creating Moist Microclimate Hide Caves',
      'Ackie Monitor (Spiny-Tailed Monitor): The Ultimate Captive Monitor Lizard Setup Guide'
    ]
  },
  {
    category: 'snakes', pet: 'Snake', image: PET_IMAGES.snake_corn,
    titles: [
      'Garter Snake Co-habitation: Commensal Social Behaviors, Worm Diets, and Water Features',
      'Rainbow Boa (Epicrates cenchria) Care: 90%+ Humidity Demands and Prismatic Scale Physics',
      'How to Weigh Your Snake Accurately: Digital Kitchen Scales, Bowls, and Growth Curves',
      'Snake Parasites: Snake Mites (Ophionyssus natricis) Eradication and Provent-a-Mite Usage',
      'African Egg-Eating Snake (Dasypeltis): Finch Egg Sourcing, Vertebral Spikes, and Shell Regurgitation',
      'Corn Snake Morphs Explained: Amelanistic, Anerythristic, Snow, and Palmetto Genetics',
      'How to Prevent Snake Escapes: Heavy-Duty Terrarium Screen Clips and Cord Seal Plugs',
      'Green Tree Python (Morelia viridis): Perch Design, Arboreal Humidity, and Gentle Hook Handling',
      'Snake Cloacal Prolapse: Immediate Sugar Water Swelling Reduction and Veterinary Emergency Steps',
      'Carpet Python Care: Australian Semi-Arboreal Giants, High-Output Heat, and Cage Dimensions',
      'Why Snakes Yawn: Realigning the Quadrate Bone After Feeding vs Respiratory Distress',
      'Bullsnake and Pine Snake Husbandry: Defensive Hissing, Heavy Substrates, and Burrowing Dynamics',
      'Setting Up a Quarantine Enclosure for New Snakes: Paper Towels, Bleach Disinfection, and 90 Days'
    ]
  },
  {
    category: 'small-pets', pet: 'Small Pet', image: PET_IMAGES.rabbit_cute,
    titles: [
      'Rabbit Head Tilt (Torticollis): E. Cuniculi vs Inner Ear Infections and Panacur Protocols',
      'Guinea Pig Bumblefoot (Pododermatitis): Wire Floor Dangers, Chlorhexidine Soaks, and Soft Fleece',
      'Roborovski Dwarf Hamsters: High-Speed Sand Baths, Wheel Sizing, and Scatter Feeding',
      'Ferret Insulinoma: Hypoglycemia Seizures, Prednisolone Regimens, and Protein Snacks',
      'Degu Care Guide: Sugar-Free Diets, Diabetes Vulnerability, and Metal Chew-Proof Enclosures',
      'Rabbit Bonding Guide: The Stress Bonding (Car Ride) Myth vs Neutral Territory Dates',
      'Gerbil Clan Dynamics: Deep 15-Inch Tunnel Substrates, Cardboard Chewing, and Declanning Signs',
      'Fancy Rat Respiratory Health: Mycoplasma Pulmonis, Dusty Beddings to Avoid, and Enrofloxacin',
      'Pet Mouse Care: Male Scent Marking Management, Wire Spacing, and Social Female Groups',
      'Chinchilla Malocclusion: Elongated Tooth Roots, Drooling ' + "'Slobbers'" + ', and X-Ray Diagnosis',
      'Fleece Bedding vs Paper Pellets for Small Animals: Washing Guides and Ammonia Odor Control',
      'Ferret Proofing Your Living Room: Recliner Hazards, Foam Rubber Ingestion, and Door Sweeps',
      'How to Safely Trim Rabbit Nails Without Hurting the Quick: Flashlight Shining Tricks',
      'Guinea Pig Bladder Sludge: Calcium-to-Phosphorus Hay Balancing and Low-Oxalate Greens'
    ]
  },
  {
    category: 'aquatics', pet: 'Aquatics', image: PET_IMAGES.aquatic_tank,
    titles: [
      'Freshwater Fish Ich (White Spot Disease): 86°F Heat Treatments vs Malachite Green Meds',
      'Setting Up a Walstad Method Planted Tank: Organic Potting Soil, Zero Filter Science, and Plant Ratios',
      'Corydoras Catfish Care: Sand Substrates for Delicate Barbels, Schooling Numbers, and Sinking Wafers',
      'Aquarium Water Hardness (GH & KH) Decoded: How Buffer Capacity Prevents Catastrophic pH Crashes',
      'Neon Tetra vs Cardinal Tetra: Temperature Differences, Neon Tetra Disease, and Aquascaping',
      'African Dwarf Frogs (ADF) Care: Target Feeding Pellets, Low Water Flow, and Tankmate Safety',
      'Aquarium Sump Filters vs Canister Filters: Biological Filtration Surface Area and Media Stacking',
      'Cichlid Aggression Management: Overstocking Strategies, Sightline Breaks, and Hard Alkaline Water',
      'Betta Bubble Nests: Sexual Maturity vs Happiness and Breeding Conditioning Realities',
      'How to Safely Acclimate New Fish: Drip Acclimation Systems vs Float-and-Drop Temperature Equalizing',
      'Mystery Snails and Nerite Snails: Calcium Shell Erosion Fixes and Zero-Algae Cleaners',
      'Aquarium Lighting PAR and PUR Explained: How Spectrum Affects Plant Growth vs Nuisance Algae'
    ]
  }
];

// Expand FULL_ARTICLE_LIST with all generated blueprint titles
EXPANSION_MATRICES.forEach(mat => {
  mat.titles.forEach(title => {
    const slug = generateSlug(title);
    FULL_ARTICLE_LIST.push({
      category: mat.category,
      pet: mat.pet,
      image: mat.image,
      title: title,
      slug: slug,
      isPopular: Math.random() > 0.75,
      isFeatured: Math.random() > 0.85,
      schemaType: title.toLowerCase().includes('how to') ? 'HowTo' : 'Article',
      metaDesc: `Expert veterinary guide on ${title.toLowerCase().replace(/['"]/g, '')}. Discover clinical symptoms, home protocols, and scientific management.`,
      topicKey: slug
    });
  });
});

console.log(`Compiled ${FULL_ARTICLE_LIST.length} distinct article blueprints.`);

// Insert all into the database
const dateBase = new Date();
let insertedCount = 0;

FULL_ARTICLE_LIST.forEach((bp, index) => {
  const author = VET_AUTHORS[index % VET_AUTHORS.length];
  // Stagger publication dates over the past 90 days to create a rich historical archive
  const pubDate = new Date(dateBase.getTime() - (index * 8 * 60 * 60 * 1000)).toISOString();
  
  const contentHtml = buildFullArticleContent(bp);
  const readingTime = calculateReadingTime(contentHtml);

  // FAQs
  const faqs = [
    {
      question: `What is the most critical first step for ${bp.title}?`,
      answer: `Ensure an immediate calm environment, check baseline vital metrics (hydration, respiration, posture), and adjust environmental conditions (temperature/lighting) to native biological requirements.`
    },
    {
      question: `How can I tell if this issue requires urgent emergency veterinary care?`,
      answer: `Look for red flags: sudden cessation of food/water intake, respiratory clicks or open-mouth breathing, extreme lethargy, abnormal fecal output, or vocalization indicating pain.`
    },
    {
      question: `Are over-the-counter home remedies safe for this?`,
      answer: `Never administer human medications (such as acetaminophen, ibuprofen, or essential oils) to companion animals as they cause fatal toxicity. Stick strictly to veterinary-tested parameters and protocols.`
    }
  ];

  // How to steps
  const howToSteps = bp.schemaType === 'HowTo' ? [
    {
      title: 'Step 1: Preparation & Equipment Sanitation',
      text: 'Gather all sterile equipment, treats, and calming items in advance in a quiet, draft-free room with non-slip flooring.'
    },
    {
      title: 'Step 2: Low-Stress Animal Engagement',
      text: 'Approach gently using soft vocal tones, offering small positive reinforcers to establish comfort and cooperation.'
    },
    {
      title: 'Step 3: Systematic Execution of the Protocol',
      text: 'Follow the clinical guidelines steadily without rushing. If the animal displays mounting stress signals, pause and resume later.'
    },
    {
      title: 'Step 4: Post-Care Reward & Recovery Monitoring',
      text: 'Conclude with a high-value jackpot reward, record observations in your pet log, and inspect the recovery area over the next 24 hours.'
    }
  ] : [];

  const articleRecord = {
    slug: bp.slug,
    title: bp.title,
    meta_title: `${bp.title} | PawPulse Veterinary Guides`,
    meta_description: bp.metaDesc,
    category_slug: bp.category,
    pet_type: bp.pet,
    content_html: contentHtml,
    excerpt: bp.metaDesc,
    featured_image: bp.image,
    author_name: author.name,
    author_role: author.role,
    author_avatar: author.avatar,
    reviewer_name: 'Dr. Elena Rostova, DVM, DACVB',
    reading_time_minutes: readingTime,
    views: Math.floor(Math.random() * 4500) + 250,
    is_featured: bp.isFeatured ? 1 : 0,
    is_popular: bp.isPopular ? 1 : 0,
    schema_type: bp.schemaType || 'Article',
    faqs_json: JSON.stringify(faqs),
    how_to_json: JSON.stringify(howToSteps),
    tags: JSON.stringify([bp.pet, bp.category, 'pet-care', 'veterinary-wellness', 'behavior']),
    published_at: pubDate,
    updated_at: pubDate
  };

  try {
    insertArticle(articleRecord);
    insertedCount++;
  } catch (err) {
    console.error(`Error inserting article: ${bp.slug}`, err.message);
  }
});

logPublishing(insertedCount, 'SUCCESS', `Initial database seed of ${insertedCount} comprehensive veterinary pet articles.`);

console.log(`=== Successfully Seeded ${insertedCount} Articles into PawPulse Database! ===`);
console.log(`Current Total Articles in Database: ${getArticleCount()}`);


import { Pose } from './types';
import { POSE_ICONS } from './poseIcons';

export const NATIONALITIES: string[] = [
    // Asia
    "Chinese", "Japanese", "Korean", "Indian", "Vietnamese", "Thai", "Filipino", "Saudi Arabian", "Turkish", "Iranian",
    // Europe
    "British", "French", "German", "Italian", "Spanish", "Russian", "Swedish", "Polish", "Ukrainian",
    // North America
    "American", "Canadian", "Mexican",
    // South America
    "Brazilian", "Argentinian", "Colombian",
    // Africa
    "Nigerian", "Ethiopian", "Egyptian", "South African", "Kenyan", "Ghanaian",
    // Oceania
    "Australian", "New Zealander"
];

export interface NationalityDefaults {
  skinTone: string;
  faceShape: string;
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
}

export const NATIONALITY_DEFAULTS_MAP: Record<string, NationalityDefaults> = {
    // Asia
    "Chinese": { skinTone: "Light", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    "Japanese": { skinTone: "Light", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Medium Wavy" },
    "Korean": { skinTone: "Light", faceShape: "Heart", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    "Indian": { skinTone: "Medium", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    "Vietnamese": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    "Thai": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    "Filipino": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Medium Wavy" },
    "Saudi Arabian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Medium Wavy" },
    "Turkish": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "Iranian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Medium Wavy" },
    // Europe
    "British": { skinTone: "Fair", faceShape: "Oval", eyeColor: "Blue", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "French": { skinTone: "Fair", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "German": { skinTone: "Fair", faceShape: "Square", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Short Bob" },
    "Italian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "Spanish": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Long Straight" },
    "Russian": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Long Straight" },
    "Swedish": { skinTone: "Fair", faceShape: "Square", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Medium Wavy" },
    "Polish": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Long Straight" },
    "Ukrainian": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Long Straight" },
    // North America
    "American": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Medium Wavy" },
    "Canadian": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "Mexican": { skinTone: "Tan", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    // South America
    "Brazilian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "Argentinian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" },
    "Colombian": { skinTone: "Tan", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Long Straight" },
    // Africa
    "Nigerian": { skinTone: "Dark", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Curly Afro" },
    "Ethiopian": { skinTone: "Dark", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Curly Afro" },
    "Egyptian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Medium Wavy" },
    "South African": { skinTone: "Medium", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Curly Afro" },
    "Kenyan": { skinTone: "Dark", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", hairStyle: "Curly Afro" },
    "Ghanaian": { skinTone: "Dark", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", hairStyle: "Curly Afro" },
    // Oceania
    "Australian": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Blonde", hairStyle: "Medium Wavy" },
    "New Zealander": { skinTone: "Light", faceShape: "Round", eyeColor: "Brown", hairColor: "Brown", hairStyle: "Medium Wavy" }
};

export const GENDERS: string[] = ["Female", "Male"];
export const SKIN_TONES: string[] = ["Fair", "Light", "Medium", "Olive", "Tan", "Dark"];
export const AGE_RANGES: string[] = ["18-25", "26-35", "36-45", "46-55"];
export const BUILDS: string[] = ["Slim", "Athletic", "Well-proportioned", "Curvy", "Plus-sized", "Pregnant"];
export const HEIGHT_RANGES: string[] = ["Petite", "Average", "Tall", "Custom"];

export const HAIR_COLORS: string[] = ["Black", "Brown", "Blonde", "Red", "Gray", "White"];

export const FEMALE_HAIR_STYLES: string[] = [
    "Long Straight",
    "Long Wavy",
    "Long Curly",
    "Medium Wavy",
    "Medium Straight",
    "Short Bob",
    "Pixie Cut",
    "Curly Afro",
    "High Ponytail",
    "Elegant Updo",
    "Box Braids",
    "Messy Bun",
    "Wavy Lob",
    "Bangs",
    "Shag Cut",
    "Cornrows",
    "Dreadlocks",
    "Top Knot",
    "French Braid",
    "Fishtail Braid",
    "Space Buns"
];
export const MALE_HAIR_STYLES: string[] = [
    "Short and Tidy",
    "Crew Cut",
    "Slicked Back",
    "Undercut",
    "Fade",
    "Medium Wavy",
    "Long Straight",
    "Man Bun",
    "Curly Top",
    "Quiff",
    "Buzz Cut",
    "Pompadour",
    "Comb Over",
    "French Crop",
    "Textured Crop",
    "Spiky Hair",
    "Side Part",
    "Mohawk"
];

export const EYE_COLORS: string[] = ["Brown", "Blue", "Green", "Hazel", "Gray"];
export const FACE_SHAPES: string[] = ["Oval", "Round", "Square", "Heart", "Diamond"];

// New constants inspired by Portrait Master
export const EXPRESSIONS: string[] = ["Neutral", "Smiling", "Serious", "Thoughtful", "Confident"];
export const SHOT_TYPES: string[] = ["Close-up Portrait", "Medium Shot", "Cowboy Shot", "Full Body Shot"];
export const CAMERA_ANGLES: string[] = ["Eye-level", "Slightly High Angle", "Slightly Low Angle"];
export const LIGHTING_STYLES: string[] = ["Soft Studio Light", "Dramatic Rim Light", "Cinematic Lighting", "Golden Hour Glow"];
export const LENS_TYPES: string[] = ["85mm Portrait Lens (f/1.4)", "50mm Standard Lens (f/1.8)", "35mm Environmental Lens (f/2.0)"];

export const FABRIC_TYPES: string[] = ["None", "Cotton", "Silk", "Denim", "Leather", "Wool"];

export const BACKGROUND_PRESETS: { name: string; prompt: string }[] = [
    { name: "studio_white", prompt: "a plain, seamless, pure white studio backdrop" },
    { name: "outdoor_cafe", prompt: "a charming outdoor cafe with blurred background" },
    { name: "city_night", prompt: "a vibrant city street at night with bokeh lights" },
    { name: "beach_sunset", prompt: "a beautiful beach at sunset with golden light" },
    { name: "modern_loft", prompt: "a stylish, sunlit modern loft apartment" },
    { name: "forest_path", prompt: "a serene forest path with dappled sunlight" }
];

const poseDefinitions: { name: string; prompt: string }[] = [
  { name: "classic_front", prompt: "stand facing forward, feet shoulder-width, arms at sides, neutral posture" },
  { name: "three_quarter_stand", prompt: "stand at 45 degrees, torso angled, head turned forward" },
  { name: "contrapposto_lean", prompt: "shift weight to back leg, hips tilted, front knee soft, relaxed shoulders" },
  { name: "hands_in_pockets", prompt: "stand with hands in front pockets, thumbs out, elbows relaxed" },
  { name: "one_hand_on_hip", prompt: "stand with one hand on hip, other arm relaxed, slight hip shift" },
  { name: "walking_step", prompt: "take a natural step, front foot slightly crossing, arms swinging lightly" },
  { name: "over_the_shoulder", prompt: "turn back slightly, head looking over shoulder, shoulders relaxed" },
  { name: "crossed_arms", prompt: "stand with arms loosely crossed, shoulders down, spine tall" },
  { name: "wall_lean", prompt: "lean one shoulder against wall, one knee bent, ankles relaxed" },
  { name: "stool_edge_sit", prompt: "sit on stool edge, knees together or ankles crossed, back tall, hands on thighs" },
  { name: "seated_forward_lean", prompt: "sit with elbows on thighs, slight forward lean, hands relaxed" },
  { name: "hair_tuck", prompt: "raise one hand to tuck hair behind ear, chin slightly down" },
  { name: "hem_pinch", prompt: "lightly pinch garment hem with one hand, other arm relaxed" },
  { name: "pocket_emphasis", prompt: "place both hands into pockets, thumbs hooked, stance relaxed" },
  { name: "hood_up", prompt: "raise hood, head slightly down, eyes upward without tilting torso" },
  { name: "cuff_adjust", prompt: "lift hands to adjust sleeve cuff, wrists visible, elbows close to body" },
  { name: "bag_carry_side", prompt: "hold bag at side with straight arm, opposite hand relaxed on hip or thigh" },
  { name: "toe_point_lift", prompt: "lift front leg slightly, toe pointed forward, knee soft, balance steady" },
  { name: "twirl", prompt: "rotate torso with a gentle skirt or dress swing, arms relaxed outward" },
  { name: "back_view_head_turn", prompt: "stand facing away, head turned to side, arms at sides" },
  { name: "side_profile", prompt: "stand in side profile, arms relaxed, posture straight" },
  { name: "floor_sit_casual", prompt: "sit on floor, one knee up, other leg extended, hands resting beside hips" },
  { name: "chair_backwards", prompt: "sit astride a chair, arms draped over backrest, shoulders relaxed" },
  { name: "phone_in_hand", prompt: "hold phone in one hand near hip or chest, opposite arm relaxed" },
  { name: "zip_up", prompt: "grasp zipper with both hands, pull halfway, elbows slightly bent" },
  { name: "waist_grip", prompt: "place both hands lightly on belt or waistband, elbows angled out" },
  { name: "sleeve_roll", prompt: "roll sleeve with one hand while other forearm is raised" },
  { name: "hat_tip", prompt: "touch brim with fingertips, tilt hat slightly, head tilted a touch" },
  { name: "accessory_frame", prompt: "raise fingers near collarbone or ear to frame accessory, wrist relaxed" },
  { name: "fabric_stretch", prompt: "hold fabric edges with both hands and stretch gently outward" }
];

export const POSES: Pose[] = poseDefinitions.map(pose => ({
  ...pose,
  imageUrl: POSE_ICONS[pose.name],
}));

export const STYLING_LIBRARY = {
  tops: [
    { name: "white_t-shirt", thumbnail: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKlJREFUeJzt0UENwCAQBEF/s4iTo9hBEf2Wl5Acz3sVszMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIC/AQ8yOAEsDXw/AAAAABJRU5ErkJggg==", image: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKlJREFUeJzt0UENwCAQBEF/s4iTo9hBEf2Wl5Acz3sVszMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIC/AQ8yOAEsDXw/AAAAABJRU5ErkJggg==" },
    { name: "black_tank_top", thumbnail: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAClJREFUeJzt0AEJAAAEAMC/tD+HYfAAurlzByBAgAABAgQIECBAgAABAgQI/Bq4AQZBAAE+870YAAAAAElFTkSuQmCC", image: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAClJREFUeJzt0AEJAAAEAMC/tD+HYfAAurlzByBAgAABAgQIECBAgAABAgQI/Bq4AQZBAAE+870YAAAAAElFTkSuQmCC" },
  ],
  bottoms: [
    { name: "blue_jeans", thumbnail: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKxJREFUeJzt0EEOACAQBEF/s4iTo5hBEf2Wl5AcD3sVsxMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIC/AQ8yOAEsK4e8XgAAAABJRU5ErkJggg==", image: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKxJREFUeJzt0EEOACAQBEF/s4iTo5hBEf2Wl5AcD3sVsxMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIC/AQ8yOAEsK4e8XgAAAABJRU5ErkJggg==" },
    { name: "black_trousers", thumbnail: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAClJREFUeJzt0AEJAAAEAMC/tD+HYfAAurlzByBAgAABAgQIECBAgAABAgQI/Bq4AQZBAAE+870YAAAAAElFTkSuQmCC", image: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAClJREFUeJzt0AEJAAAEAMC/tD+HYfAAurlzByBAgAABAgQIECBAgAABAgQI/Bq4AQZBAAE+870YAAAAAElFTkSuQmCC" },
    { name: "denim_skirt", thumbnail: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKtJREFUeJzt0UENACAQBEF/s4iTo9hBEf2Wl5AcL3sVszMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIA/AQ4yOAEsSl1eDwAAAABJRU5ErkJggg==", image: "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAKtJREFUeJzt0UENACAQBEF/s4iTo9hBEf2Wl5AcL3sVszMAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIA/AQ4yOAEsSl1eDwAAAABJRU5ErkJggg==" },
  ]
};
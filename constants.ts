
import { Pose, Bottom } from './types';
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
  femaleHairStyle: string;
  maleHairStyle: string;
}

export const NATIONALITY_DEFAULTS_MAP: Record<string, NationalityDefaults> = {
    // Asia
    "Chinese": { skinTone: "Light", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Long Straight", maleHairStyle: "Side Part" },
    "Japanese": { skinTone: "Light", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Bun", maleHairStyle: "Slicked Back" },
    "Korean": { skinTone: "Light", faceShape: "Heart", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Medium Wavy", maleHairStyle: "Undercut" },
    "Indian": { skinTone: "Medium", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Long Straight", maleHairStyle: "Slicked Back" },
    "Vietnamese": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "High Ponytail", maleHairStyle: "Slicked Back" },
    "Thai": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Long Straight", maleHairStyle: "Side Part" },
    "Filipino": { skinTone: "Medium", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Medium Wavy", maleHairStyle: "Slicked Back" },
    "Saudi Arabian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Medium Wavy", maleHairStyle: "Side Part" },
    "Turkish": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Slicked Back" },
    "Iranian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Medium Wavy", maleHairStyle: "Slicked Back" },
    // Europe
    "British": { skinTone: "Fair", faceShape: "Oval", eyeColor: "Blue", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Undercut" },
    "French": { skinTone: "Fair", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Bun", maleHairStyle: "Side Part" },
    "German": { skinTone: "Fair", faceShape: "Square", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "Short Pixie Cut", maleHairStyle: "Buzz Cut" },
    "Italian": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Slicked Back" },
    "Spanish": { skinTone: "Olive", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "High Ponytail", maleHairStyle: "Side Part" },
    "Russian": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "Long Straight", maleHairStyle: "Buzz Cut" },
    "Swedish": { skinTone: "Fair", faceShape: "Square", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "Medium Wavy", maleHairStyle: "Undercut" },
    "Polish": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "Long Straight", maleHairStyle: "Buzz Cut" },
    "Ukrainian": { skinTone: "Fair", faceShape: "Round", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "Bun", maleHairStyle: "Side Part" },
    // North America
    "American": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "High Ponytail", maleHairStyle: "Undercut" },
    "Canadian": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Side Part" },
    "Mexican": { skinTone: "Tan", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Long Straight", maleHairStyle: "Slicked Back" },
    // South America
    "Brazilian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Side Part" },
    "Argentinian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Long Straight", maleHairStyle: "Slicked Back" },
    "Colombian": { skinTone: "Tan", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "High Ponytail", maleHairStyle: "Slicked Back" },
    // Africa
    "Nigerian": { skinTone: "Dark", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Curly Afro", maleHairStyle: "Curly Afro" },
    "Ethiopian": { skinTone: "Dark", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Curly Afro", maleHairStyle: "Curly Afro" },
    "Egyptian": { skinTone: "Tan", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Medium Wavy", maleHairStyle: "Slicked Back" },
    "South African": { skinTone: "Medium", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Curly Afro", maleHairStyle: "Curly Afro" },
    "Kenyan": { skinTone: "Dark", faceShape: "Oval", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Curly Afro", maleHairStyle: "Curly Afro" },
    "Ghanaian": { skinTone: "Dark", faceShape: "Round", eyeColor: "Brown", hairColor: "Black", femaleHairStyle: "Curly Afro", maleHairStyle: "Curly Afro" },
    // Oceania
    "Australian": { skinTone: "Light", faceShape: "Oval", eyeColor: "Blue", hairColor: "Blonde", femaleHairStyle: "High Ponytail", maleHairStyle: "Undercut" },
    "New Zealander": { skinTone: "Light", faceShape: "Round", eyeColor: "Brown", hairColor: "Brown", femaleHairStyle: "Medium Wavy", maleHairStyle: "Buzz Cut" }
};

export const GENDERS: string[] = ["Female", "Male"];
export const SKIN_TONES: string[] = ["Fair", "Light", "Medium", "Olive", "Tan", "Dark"];
export const AGE_RANGES: string[] = ["18-25", "26-35", "36-45", "46-55"];
export const BUILDS: string[] = ["Slim", "Athletic", "Well-proportioned", "Curvy", "Plus-sized", "Pregnant"];
export const HEIGHT_RANGES: string[] = ["Petite", "Average", "Tall", "Custom"];

export const HAIR_COLORS: string[] = ["Black", "Brown", "Blonde", "Red", "Gray", "White"];
export const FEMALE_HAIR_STYLES: string[] = ["Long Straight", "Medium Wavy", "Short Pixie Cut", "Bob Cut", "High Ponytail", "Braided Ponytail", "Bun", "Curly Afro"];
export const MALE_HAIR_STYLES: string[] = ["Slicked Back", "Undercut", "Side Part", "Crew Cut", "Messy Quiff", "Medium Wavy", "Buzz Cut", "Curly Afro", "Long Straight"];

export const EYE_COLORS: string[] = ["Brown", "Blue", "Green", "Hazel", "Gray"];
export const FACE_SHAPES: string[] = ["Oval", "Round", "Square", "Heart", "Diamond"];

// New constants inspired by Portrait Master
export const EXPRESSIONS: string[] = ["Neutral", "Smiling", "Serious", "Thoughtful", "Confident"];
export const SHOT_TYPES: string[] = ["Close-up Portrait", "Medium Shot", "Cowboy Shot", "Full Body Shot"];
export const CAMERA_ANGLES: string[] = ["Eye-level", "Slightly High Angle", "Slightly Low Angle"];
export const LIGHTING_STYLES: string[] = ["Soft Studio Light", "Dramatic Rim Light", "Cinematic Lighting", "Golden Hour Glow"];
export const LENS_TYPES: string[] = ["85mm Portrait Lens (f/1.4)", "50mm Standard Lens (f/1.8)", "35mm Environmental Lens (f/2.0)"];

export const FABRIC_TYPES: string[] = ["None", "Cotton", "Silk", "Denim", "Leather", "Wool"];

const POSE_PROMPTS: Record<string, string> = {
    classic_front: "A full body shot of a model standing in a classic frontal pose, looking directly at the camera with a neutral expression.",
    three_quarter_stand: "Model standing in a three-quarter pose, angled slightly away from the camera, looking towards the camera.",
    contrapposto_lean: "Model in a relaxed contrapposto pose, with weight shifted to one leg, creating a gentle S-curve in the body.",
    hands_in_pockets: "A casual pose with the model's hands placed in their pockets.",
    one_hand_on_hip: "A confident pose with one hand placed firmly on the hip.",
    walking_step: "A dynamic pose capturing the model in a natural walking motion, mid-stride.",
    over_the_shoulder: "Model looking back over their shoulder towards the camera, showing the back and side of the outfit.",
    crossed_arms: "A strong pose with arms crossed over the chest.",
    wall_lean: "A relaxed pose with the model leaning against a plain wall.",
    stool_edge_sit: "Model sitting on the edge of a stool, showcasing the drape of the garment.",
    seated_forward_lean: "Model seated and leaning forward, with a thoughtful or engaged expression.",
    hair_tuck: "A candid-style pose, with the model tucking a strand of hair behind their ear.",
    hem_pinch: "A detailed shot where the model is lightly pinching the hem of their clothing to show the fabric.",
    pocket_emphasis: "A pose emphasizing a pocket detail, perhaps with a thumb hooked in it.",
    hood_up: "Model wearing a hooded garment with the hood up, creating a modern, urban look.",
    cuff_adjust: "A detailed pose showing the model adjusting the cuff of their sleeve.",
    bag_carry_side: "Model holding a handbag or tote bag naturally at their side.",
    toe_point_lift: "An elegant pose with one foot pointing forward, heel slightly lifted.",
    twirl: "A dynamic pose capturing the movement and flow of a skirt or dress during a twirl.",
    back_view_head_turn: "Model facing away from the camera, with their head turned to look back, showcasing the back of the garment.",
    side_profile: "A clean side profile shot of the model, standing straight.",
    floor_sit_casual: "A relaxed pose with the model sitting casually on the floor.",
    chair_backwards: "An unconventional seated pose, with the model sitting backwards on a chair.",
    phone_in_hand: "A modern, lifestyle pose with the model holding a smartphone.",
    zip_up: "A pose focused on the action of zipping up a jacket or top.",
    waist_grip: "A pose with hands on the waist, defining the silhouette.",
    sleeve_roll: "A casual action pose of rolling up sleeves.",
    hat_tip: "A playful pose of tipping a hat.",
    accessory_frame: "A pose where hands frame an accessory like a watch or bracelet.",
    fabric_stretch: "A pose where the model gently stretches the fabric to demonstrate its elasticity."
};

export const POSES: Pose[] = Object.keys(POSE_ICONS).map(name => ({
    name,
    imageUrl: POSE_ICONS[name],
    prompt: POSE_PROMPTS[name] || name.replace(/_/g, ' ') // Fallback prompt
}));


export const BACKGROUND_PRESETS: { name: string; prompt: string }[] = [
    { name: "studio_white", prompt: "a plain, seamless, pure white studio backdrop" },
    { name: "outdoor_cafe", prompt: "a charming outdoor cafe with blurred background" },
    { name: "city_night", prompt: "a vibrant city street at night with bokeh lights" },
    { name: "beach_sunset", prompt: "a beautiful beach at sunset with calm waves" },
    { name: "modern_loft", prompt: "a spacious modern loft apartment with large windows" },
    { name: "forest_path", prompt: "a tranquil forest path with sunbeams filtering through the trees" }
];

export const BOTTOM_PRESETS: Bottom[] = [
    {
        name: "blue_jeans",
        thumbnail: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxyZWN0IGZpbGw9IiNGRkZGRkYiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48L3JlY3Q+CiAgICAgICAgPHBhdGggZD0iTSAzMCw5NSBMIDIwLDEwIEggNTUgTCA0NSw5NSBaIiBmaWxsPSIjM2I4MmY2Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA3MCw5NSBMIDgwLDEwIEggNDUgTCA1NSw5NSBaIiBmaWxsPSIjM2I4MmY2Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA0NSwxMCBIIDU1IEwgNTAsMjAgWiIgZmlsbD0iIzI1NjNlYiI+PC9wYXRoPgogICAgPC9nPgo8L3N2Zz4=",
        segmented: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxwYXRoIGQ9Ik0gMzAsOTUgTCAyMCwxMCBIIDU1IEwgNDUsOTUgWiIgZmlsbD0iIzNiODJmNiI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNzAsOTUgTCA4MCwxMCBIIDQ1IEwgNTUsOTUgWiIgZmlsbD0iIzNiODJmNiI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNDUsMTAgSCA1NSBMIDUwLDIwIFoiIGZpbGw9IiMyNTYzZWIiPjwvcGF0aD4KICAgIDwvZz4KPC9zdmc+",
    },
    {
        name: "black_trousers",
        thumbnail: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxyZWN0IGZpbGw9IiNGRkZGRkYiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48L3JlY3Q+CiAgICAgICAgPHBhdGggZD0iTSAzMCw5NSBMIDI1LDEwIEggNTUgTCA0NSw5NSBaIiBmaWxsPSIjMTcyYTRkIj48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA3MCw5NSBMIDc1LDEwIEggNDUgTCA1NSw5NSBaIiBmaWxsPSIjMTcyYTRkIj48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA0NSwxMCBIIDU1IEwgNTAsMjAgWiIgZmlsbD0iIzExMTgyNyI+PC9wYXRoPgogICAgPC9nPgo8L3N2Zz4=",
        segmented: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxwYXRoIGQ9Ik0gMzAsOTUgTCAyNSwxMCBIIDU1IEwgNDUsOTUgWiIgZmlsbD0iIzE3MmE0ZCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNzAsOTUgTCA3NSwxMCBIIDQ1IEwgNTUsOTUgWiIgZmlsbD0iIzE3MmE0ZCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNDUsMTAgSCA1NSBMIDUwLDIwIFoiIGZpbGw9IiMxMTE4MjciPjwvcGF0aD4KICAgIDwvZz4KPC9zdmc+",
    },
    {
        name: "white_shorts",
        thumbnail: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxyZWN0IGZpbGw9IiNGRkZGRkYiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48L3JlY3Q+CiAgICAgICAgPHBhdGggZD0iTSAzMCw1MCBMIDI1LDEwIEggNTUgTCA0NSw1MCBaIiBmaWxsPSIjZjhmYWZjIj48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA3MCw1MCBMIDc1LDEwIEggNDUgTCA1NSw1MCBaIiBmaWxsPSIjZjhmYWZjIj48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTSA0NSwxMCBIIDU1IEwgNTAsMjAgWiIgZmlsbD0iI2YxZjVmOSI+PC9wYXRoPgogICAgPC9nPgo8L3N2Zz4=",
        segmented: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8ZyBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPgogICAgICAgIDxwYXRoIGQ9Ik0gMzAsNTIgTCAyNSwxMiBIIDU1IEwgNDUsNTIgWiIgZmlsbD0iI2Y4ZmFmYyI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNzAsNTIgTCA3NSwxMiBIIDQ1IEwgNTUsNTIgWiIgZmlsbD0iI2Y4ZmFmYyI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik0gNDUsMTIgSCA1NSBMIDUwLDIyIFoiIGZpbGw9IiNmMWY1ZjkiPjwvcGF0aD4KICAgIDwvZz4KPC9zdmc+",
    }
];

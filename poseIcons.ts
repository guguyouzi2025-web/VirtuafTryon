// This file contains unique, base64-encoded SVG icons for each pose.

// Helper to create a base64 encoded SVG data URI for a pose icon.
const createIcon = (path: string): string => {
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#6b7280" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="25" r="10"/>${path}</g></svg>`;
  const encoded = btoa(svg);
  return `data:image/svg+xml;base64,${encoded}`;
};

export const POSE_ICONS: Record<string, string> = {
  classic_front: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L80,55"/>`),
  three_quarter_stand: createIcon(`<path d="M50,35 L45,65 M45,65 L20,90 M45,65 L60,90 M45,47 L25,55 M45,47 L75,50"/>`),
  contrapposto_lean: createIcon(`<path d="M50,35 V65 M55,65 L30,90 M55,65 L80,85 M50,45 L25,55 M50,45 L75,55"/>`),
  hands_in_pockets: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L35,60 M50,45 L65,60"/>`),
  one_hand_on_hip: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L65,60 L75,55"/>`),
  walking_step: createIcon(`<path d="M50,35 V65 M50,65 L35,80 L25,95 M50,65 L75,90 M50,45 L30,55 M50,45 L80,50"/>`),
  over_the_shoulder: createIcon(`<path d="M50,35 L55,65 M55,65 L50,90 M55,65 L70,90 M55,47 L45,55 M55,47 L75,50"/>`),
  crossed_arms: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M35,45 L65,55 M35,55 L65,45"/>`),
  wall_lean: createIcon(`<path d="M55,35 V65 M55,65 L30,90 M55,65 L80,85 M55,45 L30,55 M55,45 L80,55 M15,5 V95"/>`),
  stool_edge_sit: createIcon(`<path d="M50,35 V60 M50,60 L35,80 M50,60 L65,80 M50,45 L25,50 M50,45 L75,50 M20,80 H80"/>`),
  seated_forward_lean: createIcon(`<path d="M50,35 V60 M50,60 L35,80 M50,60 L65,80 M50,45 L40,60 M50,45 L60,60 M20,80 H80"/>`),
  hair_tuck: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 C60,45 60,30 55,25"/>`),
  hem_pinch: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L65,65 C70,60 75,65 75,65"/>`),
  pocket_emphasis: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L35,60 M50,45 L65,60"/>`),
  hood_up: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L80,55 M40,15 Q50,5 60,15"/>`),
  cuff_adjust: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M30,55 L45,50 L40,40 M50,45 L80,55"/>`),
  bag_carry_side: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L80,55 V70 M75,70 H85 V80 H75 Z"/>`),
  toe_point_lift: createIcon(`<path d="M50,35 V65 M50,65 L40,80 L35,75 M50,65 L75,90 M50,45 L20,55 M50,45 L80,55"/>`),
  twirl: createIcon(`<path d="M50,35 V65 M50,65 L30,90 M50,65 L70,85 M50,45 L15,50 M50,45 L85,50"/>`),
  back_view_head_turn: createIcon(`<path d="M50,35 V65 M50,65 L45,90 M50,65 L55,90 M50,45 L40,55 M50,45 L60,55"/>`),
  side_profile: createIcon(`<path d="M50,35 V65 M50,65 L48,90 M50,65 L52,88 M50,45 L70,45"/>`),
  floor_sit_casual: createIcon(`<path d="M50,35 V70 M50,70 L25,90 M50,70 L60,70 L75,85 M50,45 L30,55 M50,45 L70,55"/>`),
  chair_backwards: createIcon(`<path d="M50,35 V65 M50,65 L30,85 M50,65 L70,85 M40,50 L60,50 M50,5 V65"/>`),
  phone_in_hand: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 L65,60 M60,60 H70 V70 H60 Z"/>`),
  zip_up: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L40,50 M50,45 L60,50"/>`),
  waist_grip: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L35,55 L40,60 M50,45 L65,55 L60,60"/>`),
  sleeve_roll: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L80,55 M30,55 L40,45 L30,40 M40,45 L45,50"/>`),
  hat_tip: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 C60,45 60,30 55,20 M35,17 Q50,12 65,17"/>`),
  accessory_frame: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M50,45 L20,55 M50,45 C60,45 55,40 50,40"/>`),
  fabric_stretch: createIcon(`<path d="M50,35 V65 M50,65 L25,90 M50,65 L75,90 M35,55 L25,55 M65,55 L75,55"/>`),
};
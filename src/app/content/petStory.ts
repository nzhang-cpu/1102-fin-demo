/** Copy and helpers for the autoplayed pet-policy story (adapted from the Skyline pet flow). */

export const PET_TRAVEL_TITLE = "Pet Travel Policy - International Flights";
export const DOG_TRAVEL_TITLE = "Bring a Dog on International Flights";

/** Suggestion tiles shown in the AI summary on pet searches, tied to the traveler's most recent trip (Paris); any of them starts the story. */
export const PET_SUGGESTIONS = [
  "Can I bring my pet on my trip to Paris?",
  "What documents does my pet need for Paris?",
];

export const PET_POLICY_REPLY = [
  "Hi, Jordan. Happy to help! Here's what I found about bringing pets on international flights:",
  "You can bring your pet on an international flight as long as it meets our weight and vaccination criteria. For in-cabin and cargo travel, your pet and crate must meet certain requirements. We will also need a valid health certificate issued within 10 days of departure and country-specific requirements for your destination.",
].join("\n\n");

export const PET_CARD_INTRO =
  "Now, please tell me more about your pet so I can help you with your travel arrangements.";

export const PET_FINAL_REPLY =
  "Good news, your dog is cleared to fly with you on your trip to Paris! As a valued Premier Gold member, we've waived the $125 pet fee for your flight. We've sent an updated ticket to your email.";

/** Keyword intent check, as in the original flow. */
export function isPetTravelQuery(value: string) {
  const q = value.toLowerCase();
  return /\b(pets?|dogs?|cats?|animals?|puppy|puppies)\b/.test(q);
}

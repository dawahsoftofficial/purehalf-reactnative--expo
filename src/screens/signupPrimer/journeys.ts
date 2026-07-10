import type { PrimerAnswers } from './primer-logic';
import type { PrimerGender, PrimerOption, PrimerStepDef } from './primer-types';

// Copy is inline English here (rendered through the app Text component, which
// runs it through t()); full localisation is the documented i18n follow-up.

const o = (id: string, label: string): PrimerOption => ({ id, label });

const GENEROUS_OFFERS = ['separate_home', 'continue_career', 'simple_nikah'];

// Sect options mirror the two Sunni madhahib the backend stores (sect-2 Hanafi,
// sect-1 Salafi) so a generic "Sunni" is never collapsed onto one sub-sect on a
// public profile. Shared by both journeys.
const SECT_OPTIONS: PrimerOption[] = [
  o('sunni_hanafi', 'Sunni (Hanafi)'),
  o('sunni_salafi', 'Sunni (Salafi)'),
  o('shia', 'Shia'),
  o('other', 'Other'),
  o('prefer_not_say', 'Prefer not to say'),
];

const femaleJourney: PrimerStepDef[] = [
  {
    id: 'stage',
    control: 'single',
    visibility: 'private',
    question: 'Where are you in this journey?',
    options: [
      o('just_starting', 'Just starting out'),
      o('searching_while', 'Searching for a while'),
      o('tired_rishta', 'Honestly tired of the rishta process'),
      o('family_searching', 'My family is searching for me'),
    ],
  },
  {
    id: 'status',
    control: 'status',
    visibility: 'public',
    question: "What's your current status?",
    options: [
      o('single', 'Single (never married)'),
      o('divorced', 'Divorced'),
      o('widowed', 'Widowed'),
    ],
  },
  {
    id: 'caste',
    control: 'casteCombo',
    visibility: 'public',
    question: 'Your Khandan / Caste',
    subtitle: 'Type it in, or choose Prefer not to say.',
  },
  {
    id: 'deen',
    control: 'deen',
    visibility: 'public',
    hasRevert: true,
    question: 'Your relationship with deen',
    options: [
      o('pray_5', 'I pray 5 times a day'),
      o('pray_sometimes', 'I pray sometimes'),
      o('working_on_it', 'Working on it'),
      o('prefer_not_say', 'Prefer not to say'),
    ],
  },
  {
    id: 'sect',
    control: 'sectCombo',
    visibility: 'public',
    question: 'Your sect',
    options: SECT_OPTIONS,
  },
  {
    id: 'concerns',
    control: 'multi',
    visibility: 'private',
    question: "What's been weighing on you?",
    subtitle: 'Only you can see this.',
    options: [
      o('pressure_family', 'Pressure from family/relatives'),
      o('worried_age', 'Worried about my age'),
      o('tired_rishta', 'Tired of the rishta process'),
      o('worried_career', 'Worried about my career after marriage'),
      o('need_privacy', 'I need strict privacy'),
    ],
  },
  {
    id: 'priorities',
    control: 'multi',
    max: 4,
    visibility: 'public',
    question: 'What matters most in him?',
    subtitle: 'Pick your top 4.',
    support: 'Knowing what you want is a strength — choose freely.',
    options: [
      o('strong_deen', 'Strong deen & character'),
      o('good_looking', 'Good-looking, takes care of himself'),
      o('tall', 'Tall'),
      o('financially_settled', 'Financially settled'),
      o('respected_family', 'Respected family background'),
      o('well_educated', 'Well educated'),
      o('respects_career', 'Respects my career and goals'),
      o('kind_to_women', 'Kind to the women in his life'),
      o('emotionally_mature', 'Emotionally mature'),
    ],
  },
  {
    id: 'dealbreakers',
    control: 'multi',
    visibility: 'public',
    question: 'Any of these non-negotiable?',
    support: 'Your standards protect you — never apologise for them.',
    options: [
      o('no_smoking', 'Absolutely no smoking'),
      o('no_drinking', 'No drinking'),
      o('not_second_wife', "He isn't looking for a second wife"),
      o('separate_home', 'Separate home from in-laws'),
      o('continue_working', "I'll continue working after marriage"),
      o('settled_city', 'Must be settled in/near my city'),
      o('no_dealbreakers', "No dealbreakers — I'm flexible"),
    ],
  },
  {
    id: 'partner_age',
    control: 'slider',
    visibility: 'public',
    sliderMin: 18,
    sliderMax: 60,
    question: 'What age range are you hoping for in him?',
  },
  {
    id: 'preferred_work',
    control: 'multi',
    visibility: 'public',
    question: 'His work situation — what suits you?',
    options: [
      o('business_owner', 'Business owner'),
      o('salaried', 'Salaried professional'),
      o('govt_job', 'Government job'),
      o('settled_overseas', 'Settled overseas'),
      o('no_preference', 'No preference, character first'),
    ],
  },
  {
    id: 'note',
    control: 'text',
    visibility: 'public',
    question: "Anything else you'd like to add?",
    placeholder: 'e.g. Someone honest, attentive, and family-oriented.',
  },
  {
    id: 'strengths',
    control: 'traits',
    visibility: 'public',
    question: "What's wonderful about you?",
    subtitle: 'Go on, be proud — this makes your profile shine.',
    support:
      "Masha'Allah — you sound like a wonderful woman. Any good man would be lucky.",
    options: [
      o('kind_caring', 'Kind and caring'),
      o('family_oriented', 'Family-oriented'),
      o('well_educated', 'Well educated'),
      o('ambitious', 'Ambitious and hardworking'),
      o('good_humour', 'Good sense of humour'),
      o('practising', 'Practising in my deen'),
      o('honest_loyal', 'Honest and loyal'),
      o('independent', 'Independent'),
    ],
  },
];

const maleJourney: PrimerStepDef[] = [
  {
    id: 'stage',
    control: 'single',
    visibility: 'private',
    question: 'What best describes you right now?',
    options: [
      o('ready_now', 'Ready to marry now'),
      o('getting_late', "It's getting late — I really want to settle down"),
      o('guard_deen', 'Keen to marry, to guard my deen'),
      o('been_searching', 'Been searching for a while'),
    ],
  },
  {
    id: 'status',
    control: 'status',
    visibility: 'public',
    question: "What's your current status?",
    options: [
      o('single', 'Single (never married)'),
      o('divorced', 'Divorced'),
      o('widowed', 'Widowed'),
    ],
  },
  {
    id: 'caste',
    control: 'casteCombo',
    visibility: 'public',
    question: 'Your Khandan / Caste',
    subtitle: 'Type it in, or choose Prefer not to say.',
  },
  {
    id: 'deen',
    control: 'deen',
    visibility: 'public',
    question: 'Your relationship with deen',
    options: [
      o('pray_5', 'I pray 5 times a day'),
      o('pray_sometimes', 'I pray sometimes'),
      o('working_on_it', 'Working on it'),
      o('prefer_not_say', 'Prefer not to say'),
    ],
  },
  {
    id: 'sect',
    control: 'sectCombo',
    visibility: 'public',
    question: 'Your sect',
    options: SECT_OPTIONS,
  },
  {
    id: 'concerns',
    control: 'multi',
    visibility: 'private',
    question: "Be honest — what's been the hardest part?",
    subtitle: 'Only you can see this.',
    options: [
      o('attracted', "Hard to find someone I'm genuinely attracted to"),
      o('younger', 'Hard to find someone younger, as I hoped'),
      o('compatible', "Haven't found someone truly compatible"),
      o('practises', 'Hard to find someone who practises like I do'),
      o('moving_on', 'Still moving on from a past relationship'),
      o('time_passing', 'Worried time is passing'),
    ],
  },
  {
    id: 'priorities',
    control: 'multi',
    max: 4,
    visibility: 'private',
    question: 'What matters most in her?',
    subtitle: 'Pick your top 4 — just for matching, stays private.',
    options: [
      o('beautiful', 'Beautiful / attractive'),
      o('youthful', 'Youthful and full of life'),
      o('warm_mannered', 'Warm, well-mannered nature'),
      o('easy_going', 'Easy-going and fun to be with'),
      o('practising', 'Practising deen and modesty'),
      o('honest_loyal', 'Honest and loyal'),
      o('family_oriented', 'Family-oriented'),
      o('career_plus', 'Career-minded is a plus'),
    ],
  },
  {
    id: 'partner_openness',
    control: 'multi',
    visibility: 'public',
    question: 'Her background — what are you open to?',
    options: [
      o('same_city', 'Same city'),
      o('anywhere_pakistan', 'Anywhere in Pakistan'),
      o('settled_overseas', 'Settled overseas'),
      o('other_nationalities', 'Open to other nationalities'),
      o('revert', 'Revert Muslim sisters'),
      o('open_all', 'Open to all'),
    ],
  },
  {
    id: 'partner_age',
    control: 'slider',
    visibility: 'public',
    sliderMin: 18,
    sliderMax: 60,
    question: 'What age range are you hoping for in her?',
  },
  {
    id: 'work',
    control: 'work',
    visibility: 'public',
    hasIncome: true,
    question: 'Tell us about your work',
    options: [
      o('business_owner', 'Business owner'),
      o('self_employed', 'Self-employed'),
      o('salaried', 'Salaried professional'),
      o('govt_job', 'Government job'),
      o('settled_overseas', 'Settled overseas'),
    ],
  },
  {
    id: 'habits',
    control: 'habits',
    visibility: 'public',
    required: true,
    question: 'A couple of quick facts',
  },
  {
    id: 'offerings',
    control: 'multi',
    visibility: 'public',
    question: 'What can you offer her?',
    supportIf: (answers: PrimerAnswers) => {
      const v = answers.offerings;
      return Array.isArray(v) && v.some((x) => GENEROUS_OFFERS.includes(x));
    },
    support:
      "Masha'Allah — offering this much is rare these days. A woman will value a man who brings this.",
    options: [
      o('separate_home', 'Separate home'),
      o('joint_family', 'Living with my parents (joint family)'),
      o('continue_career', 'She can continue her career'),
      o('based_abroad', 'Based abroad / relocating'),
      o('simple_nikah', 'Simple nikah, no heavy demands'),
      o('financially_independent', 'Financially independent'),
    ],
  },
  {
    id: 'strengths',
    control: 'traits',
    visibility: 'public',
    question: 'What makes you a great husband?',
    subtitle: "Own it — this is what she'll notice first.",
    support: "Masha'Allah — you've got a lot to offer. She'll see it.",
    options: [
      o('caring_supportive', 'Caring and supportive'),
      o('hardworking', 'Hardworking and ambitious'),
      o('family_oriented', 'Family-oriented'),
      o('well_educated', 'Well educated'),
      o('good_humour', 'Good sense of humour'),
      o('practising', 'Practising in my deen'),
      o('honest_loyal', 'Honest and loyal'),
      o('financially_responsible', 'Financially responsible'),
    ],
  },
];

export const journeyFor = (gender: PrimerGender): PrimerStepDef[] =>
  gender === 'male' ? maleJourney : femaleJourney;

// Bands mirror the backend earn-* attribute boundaries so income resolves to a
// single earnings_per_month_id exactly. Values are monthly, in PKR.
export const INCOME_BANDS: PrimerOption[] = [
  o('up_to_50k', 'Up to 50,000'),
  o('50k_100k', '50,000 – 100,000'),
  o('100k_200k', '100,000 – 200,000'),
  o('200k_500k', '200,000 – 500,000'),
  o('500k_1m', '500,000 – 1,000,000'),
  o('above_1m', 'Above 1,000,000'),
];

export const HABIT_OPTIONS: PrimerOption[] = [
  o('no', 'No'),
  o('occasionally', 'Occasionally'),
  o('yes', 'Yes'),
];

export { femaleJourney, maleJourney };

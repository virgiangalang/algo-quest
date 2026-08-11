import type { QuestionType } from "@/lib/learn/question-types";
import type { LearnLocale } from "@/lib/learn/locale";

export type TrialTrack = "star" | "moon" | "sun" | "cosmic";
export type TrialBlock = "listen" | "vocab" | "story" | "talk";
export type TrialPhase = "gate" | "play" | "done";

export type TrialLocalized = { id: string; en: string };

export type TrialStudent = {
  id: string;
  name: string;
  age: number;
};

export type TrialAnswerState = {
  isCorrect: boolean | null;
  attemptCount: number;
  selectedOptionIds: string[];
  answerText: string | null;
  answerJson: Record<string, unknown>;
  attachmentUrl: string | null;
  revealCorrectOptionIds?: string[];
  revealOptions?: unknown;
};

export type TrialSession = {
  phase: TrialPhase;
  student: TrialStudent;
  track: TrialTrack;
  locale: LearnLocale;
  stars: number;
  answered: Record<string, TrialAnswerState>;
  /** Blok yang sudah selesai — stiker reward. */
  blockRewards: Partial<Record<TrialBlock, boolean>>;
  markedUsed: boolean;
  showPpt: boolean;
};

export type TrialQuestionSource = {
  id: string;
  block: TrialBlock;
  type: QuestionType;
  prompt: { text: string; text_en?: string };
  options: unknown;
  correct_option_ids: string[];
  allow_multiple?: boolean;
  image_url?: string | null;
  max_attempts?: number;
  hint_after_attempts?: number;
  points?: number;
  difficulty?: number;
  estimated_seconds?: number;
  explanation?: { text?: string; text_en?: string } | null;
  hint?: { text?: string; text_en?: string } | null;
  /** Stimulus layer — Trial defaults: reveal OK + unlimited plays. */
  prompt_display?: "visible" | "hidden" | "audio_first" | "image_first";
  allow_reveal_prompt?: boolean;
  skill_tag?: "listening" | "reading" | "grammar" | "vocabulary" | "speaking" | null;
  audio_url?: string | null;
  audio_mode?: "none" | "file" | "tts";
  audio_max_plays?: number;
  passage?: { text?: string; text_en?: string } | null;
};

export type TrialStoryPanel = {
  emoji: string;
  title: TrialLocalized;
  body: TrialLocalized;
};

export type TrialTrackPack = {
  track: TrialTrack;
  title: TrialLocalized;
  subtitle: TrialLocalized;
  accentClass: string;
  glow: string;
  pptEmbedUrl: string;
  storyPanels: TrialStoryPanel[];
  questions: TrialQuestionSource[];
};

export const TRIAL_TRACKS: TrialTrack[] = ["star", "moon", "sun", "cosmic"];

export const TRIAL_SESSION_KEY = "kindora-trialclass-v2";
export const TRIAL_DEMO_IDS = ["GALANG-001", "KINDORA-001", "DEMO-001", "0101"] as const;
export const TRIAL_VALIDATOR_URL = "/api/trial-validator";

export const BLOCK_META: Record<
  TrialBlock,
  { label: TrialLocalized; rubric: TrialLocalized; emoji: string; sticker: string; reward: TrialLocalized }
> = {
  listen: {
    emoji: "👂",
    sticker: "🎧",
    label: { id: "Listen & Follow", en: "Listen & Follow" },
    rubric: { id: "Classroom Instruction", en: "Classroom Instruction" },
    reward: { id: "Stiker Super Listener!", en: "Super Listener sticker!" },
  },
  vocab: {
    emoji: "🌌",
    sticker: "🌟",
    label: { id: "Word Galaxy", en: "Word Galaxy" },
    rubric: { id: "Vocabulary", en: "Vocabulary" },
    reward: { id: "Stiker Word Star!", en: "Word Star sticker!" },
  },
  story: {
    emoji: "📖",
    sticker: "🦸",
    label: { id: "Story Quest", en: "Story Quest" },
    rubric: { id: "Reading", en: "Reading" },
    reward: { id: "Stiker Story Hero!", en: "Story Hero sticker!" },
  },
  talk: {
    emoji: "🎤",
    sticker: "🗣️",
    label: { id: "Talk Adventure", en: "Talk Adventure" },
    rubric: { id: "Speaking", en: "Speaking" },
    reward: { id: "Stiker Brave Talker!", en: "Brave Talker sticker!" },
  },
};

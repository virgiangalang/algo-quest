import type { Question, Submission } from "@/components/learn/student/roadmap-types";
import { sanitizeStudentQuestion } from "@/lib/learn/sanitize-student-question";
import type { TrialQuestionSource, TrialTrack, TrialTrackPack } from "@/lib/trialclass/types";
import { TRIAL_TRACKS } from "@/lib/trialclass/types";
import { buildStarPack } from "@/lib/trialclass/content/star";
import { buildMoonPack } from "@/lib/trialclass/content/moon";
import { buildSunPack } from "@/lib/trialclass/content/sun";
import { buildCosmicPack } from "@/lib/trialclass/content/cosmic";

function defaultTrialHint(source: TrialQuestionSource): { text: string; text_en: string } {
  switch (source.type) {
    case "ordering":
      return {
        text: "Pikirkan urutan dari awal → akhir yang paling masuk akal.",
        text_en: "Think of the most natural start → finish order.",
      };
    case "matching":
      return {
        text: "Cocokkan yang paling berhubungan — satu per satu.",
        text_en: "Match the closest pairs — one at a time.",
      };
    case "word_bank":
      return {
        text: "Baca kalimat utuh, lalu tarik kata yang paling pas.",
        text_en: "Read the whole sentence, then drag the best word.",
      };
    case "fill_blank":
      return {
        text: "Cek ejaan singkat — biasanya 1 kata sederhana.",
        text_en: "Check the short spelling — usually one simple word.",
      };
    case "checkbox":
      return {
        text: "Bisa lebih dari satu jawaban benar. Cek semua opsi.",
        text_en: "More than one answer can be right. Check every option.",
      };
    case "true_false":
      return {
        text: "Fokus ke kata kunci di kalimat True/False.",
        text_en: "Focus on the key words in the True/False sentence.",
      };
    case "essay":
      return {
        text: "Boleh dibantu tutor — tulis apa adanya, yang penting coba!",
        text_en: "Tutor can help — just try and write something real!",
      };
    default:
      return {
        text: "Baca prompt sekali lagi, lalu pilih yang paling cocok.",
        text_en: "Read the prompt once more, then pick the best match.",
      };
  }
}

function withTrialHint(source: TrialQuestionSource): TrialQuestionSource {
  return {
    ...source,
    // Trial: hint setelah 1× salah (fun, jangan frustasi).
    hint_after_attempts: 1,
    hint: source.hint ?? defaultTrialHint(source),
  };
}

function finalizePack(pack: TrialTrackPack): TrialTrackPack {
  return { ...pack, questions: pack.questions.map(withTrialHint) };
}

const PACKS: Record<TrialTrack, TrialTrackPack> = {
  star: finalizePack(buildStarPack()),
  moon: finalizePack(buildMoonPack()),
  sun: finalizePack(buildSunPack()),
  cosmic: finalizePack(buildCosmicPack()),
};

export function isTrialTrack(value: string): value is TrialTrack {
  return (TRIAL_TRACKS as string[]).includes(value);
}

export function getTrialPack(track: TrialTrack): TrialTrackPack {
  return PACKS[track];
}

export function findTrialQuestion(questionId: string): { track: TrialTrack; question: TrialQuestionSource } | null {
  for (const track of TRIAL_TRACKS) {
    const question = PACKS[track].questions.find((q) => q.id === questionId);
    if (question) return { track, question };
  }
  return null;
}

export function toStudentQuestion(
  source: TrialQuestionSource,
  submission: Submission | null,
  revealAnswers: boolean,
): Question {
  const prepared = withTrialHint(source);
  const base: Question = {
    id: prepared.id,
    type: prepared.type,
    prompt: { text: prepared.prompt.text, ...(prepared.prompt.text_en ? { text_en: prepared.prompt.text_en } : {}) } as Question["prompt"],
    options: prepared.options,
    correct_option_ids: prepared.correct_option_ids,
    allow_multiple: Boolean(prepared.allow_multiple),
    image_url: prepared.image_url ?? null,
    submission,
    max_attempts: prepared.max_attempts ?? 3,
    hint_after_attempts: prepared.hint_after_attempts ?? 1,
    points: prepared.points ?? 10,
    difficulty: prepared.difficulty ?? 1,
    estimated_seconds: prepared.estimated_seconds ?? 45,
    explanation: prepared.explanation ?? null,
    hint: prepared.hint ?? null,
    prompt_display: prepared.prompt_display ?? "visible",
    // Trial: boleh reveal teks (lebih longgar dari LMS enrolled).
    allow_reveal_prompt: prepared.allow_reveal_prompt ?? true,
    skill_tag: prepared.skill_tag ?? null,
    audio_url: prepared.audio_url ?? null,
    audio_mode: prepared.audio_mode ?? "none",
    // Trial: unlimited plays kecuali soal set angka eksplisit.
    audio_max_plays: prepared.audio_max_plays ?? 0,
    passage: prepared.passage ?? null,
  };
  const sanitized = sanitizeStudentQuestion(base, revealAnswers);
  // Hint = coaching text, bukan kunci jawaban. Sanitize LMS mengosongkan hint
  // sampai revealAnswers; trial tidak refetch lesson, jadi hint WAJIB dikembalikan
  // supaya UI bisa tampil setelah attemptCount >= hint_after_attempts.
  if (!revealAnswers && prepared.hint) {
    return { ...sanitized, hint: prepared.hint };
  }
  return sanitized;
}

export function listTrialPackSummaries() {
  return TRIAL_TRACKS.map((track) => {
    const pack = PACKS[track];
    return {
      track,
      title: pack.title,
      subtitle: pack.subtitle,
      questionCount: pack.questions.length,
      hasPpt: Boolean(pack.pptEmbedUrl.trim()),
    };
  });
}

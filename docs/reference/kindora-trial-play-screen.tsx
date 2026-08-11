"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, PartyPopper, Star, Trophy, X } from "lucide-react";
import type { Question } from "@/components/learn/student/roadmap-types";
import { QuestionRunner } from "@/components/learn/question/question-runner";
import type { AnsweredResult } from "@/components/learn/question/question-engine";
import { SlidesViewer } from "@/components/learn/student/slides-viewer";
import { PlayModeProvider } from "@/components/learn/fx/play-mode-context";
import { Confetti } from "@/components/learn/fx/confetti";
import { playCorrect } from "@/components/learn/fx/play-sfx";
import { useLearnLocale } from "@/components/learn/learn-locale-provider";
import { isQuestionSettled } from "@/lib/learn/question-settlement";
import { L, trialT } from "@/lib/trialclass/i18n";
import { BLOCK_META, type TrialBlock, type TrialSession, type TrialLocalized } from "@/lib/trialclass/types";

type ContentPayload = {
  ok: boolean;
  title: TrialLocalized;
  subtitle: TrialLocalized;
  accentClass: string;
  glow: string;
  pptEmbedUrl: string;
  hasPpt: boolean;
  storyPanels: Array<{ emoji: string; title: TrialLocalized; body: TrialLocalized }>;
  questions: Question[];
  blocks: Array<{ id: string; block: TrialBlock }>;
};

function isBlockComplete(questions: Question[], ids: string[]) {
  if (!ids.length) return false;
  return ids.every((id) => {
    const q = questions.find((item) => item.id === id);
    return q ? isQuestionSettled(q) : false;
  });
}

export function TrialPlayScreen({
  session,
  onSessionPatch,
  onFinish,
}: {
  session: TrialSession;
  onSessionPatch: (patch: Partial<TrialSession> | ((prev: TrialSession) => Partial<TrialSession>)) => void;
  onFinish: () => void;
}) {
  const { locale } = useLearnLocale();
  const [content, setContent] = useState<ContentPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [blockToast, setBlockToast] = useState<TrialBlock | null>(null);
  const celebratedBlocks = useRef<Set<TrialBlock>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetch(`/api/trialclass/content?track=${session.track}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as ContentPayload & { message?: string };
        if (!res.ok || !data.ok) throw new Error(data.message || "Gagal memuat konten.");
        if (cancelled) return;
        const withSubs = data.questions.map((q) => {
          const saved = session.answered[q.id];
          if (!saved) return q;
          return {
            ...q,
            submission: {
              question_id: q.id,
              selected_option_ids: saved.selectedOptionIds,
              answer_text: saved.answerText,
              answer_json: saved.answerJson,
              attachment_url: saved.attachmentUrl,
              is_correct: saved.isCorrect,
              attempt_count: saved.attemptCount,
              time_spent_ms: null,
            },
            ...(saved.revealCorrectOptionIds ? { correct_option_ids: saved.revealCorrectOptionIds } : {}),
            ...(saved.revealOptions ? { options: saved.revealOptions } : {}),
          };
        });
        setContent({ ...data, questions: withSubs });
        celebratedBlocks.current = new Set(
          (Object.keys(session.blockRewards || {}) as TrialBlock[]).filter((b) => session.blockRewards[b]),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || "Gagal memuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.track]);

  const blockById = useMemo(() => {
    const map = new Map<string, TrialBlock>();
    content?.blocks.forEach((b) => map.set(b.id, b.block));
    return map;
  }, [content]);

  const listenQuestionIds = useMemo(() => {
    return new Set((content?.blocks || []).filter((b) => b.block === "listen").map((b) => b.id));
  }, [content]);

  const talkQuestionIds = useMemo(() => {
    return new Set((content?.blocks || []).filter((b) => b.block === "talk").map((b) => b.id));
  }, [content]);

  const questions = content?.questions || [];
  const settledCount = questions.filter(isQuestionSettled).length;
  const allSettled = questions.length > 0 && settledCount === questions.length;
  const playMode = session.track === "star" ? "kecil" : "besar";

  const handleAnswered = useCallback(
    (result: AnsweredResult) => {
      let nextQuestions: Question[] = [];
      setContent((prev) => {
        if (!prev) return prev;
        nextQuestions = prev.questions.map((q) =>
          q.id === result.questionId
            ? {
                ...q,
                submission: {
                  question_id: q.id,
                  selected_option_ids: result.selectedOptionIds,
                  answer_text: result.answerText,
                  answer_json: result.answerJson,
                  attachment_url: result.attachmentUrl,
                  is_correct: result.isCorrect,
                  attempt_count: result.attemptCount,
                  time_spent_ms: q.submission?.time_spent_ms ?? null,
                },
                ...(result.revealCorrectOptionIds ? { correct_option_ids: result.revealCorrectOptionIds } : {}),
                ...(result.revealOptions ? { options: result.revealOptions } : {}),
              }
            : q,
        );
        return { ...prev, questions: nextQuestions };
      });

      const block = blockById.get(result.questionId);
      const blockIds = content?.blocks.filter((b) => b.block === block).map((b) => b.id) || [];

      onSessionPatch((prev) => {
        const alreadyStarred = prev.answered[result.questionId]?.isCorrect === true;
        const earned = result.isCorrect === true && !alreadyStarred ? 1 : 0;
        const answered = {
          ...prev.answered,
          [result.questionId]: {
            isCorrect: result.isCorrect,
            attemptCount: result.attemptCount,
            selectedOptionIds: result.selectedOptionIds,
            answerText: result.answerText,
            answerJson: result.answerJson,
            attachmentUrl: result.attachmentUrl,
            revealCorrectOptionIds: result.revealCorrectOptionIds,
            revealOptions: result.revealOptions,
          },
        };

        const patchedForSettle =
          nextQuestions.length > 0
            ? nextQuestions
            : questions.map((q) =>
                q.id === result.questionId
                  ? {
                      ...q,
                      submission: {
                        question_id: q.id,
                        selected_option_ids: result.selectedOptionIds,
                        answer_text: result.answerText,
                        answer_json: result.answerJson,
                        attachment_url: result.attachmentUrl,
                        is_correct: result.isCorrect,
                        attempt_count: result.attemptCount,
                        time_spent_ms: null,
                      },
                    }
                  : q,
              );

        let blockRewards = { ...prev.blockRewards };
        let newlyCleared: TrialBlock | null = null;
        if (block && blockIds.length && isBlockComplete(patchedForSettle, blockIds) && !blockRewards[block]) {
          blockRewards = { ...blockRewards, [block]: true };
          newlyCleared = block;
        }

        if (newlyCleared && !celebratedBlocks.current.has(newlyCleared)) {
          celebratedBlocks.current.add(newlyCleared);
          queueMicrotask(() => {
            setBlockToast(newlyCleared);
            setShowConfetti(true);
            playCorrect();
          });
        }

        return {
          stars: prev.stars + earned,
          answered,
          blockRewards,
        };
      });

      if (result.isCorrect === true) setShowConfetti(true);
    },
    [onSessionPatch, blockById, content?.blocks, questions],
  );

  useEffect(() => {
    if (!blockToast) return;
    const timer = window.setTimeout(() => setBlockToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [blockToast]);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="play-display animate-pulse text-lg font-bold text-white/80">Loading adventure…</p>
      </div>
    );
  }

  if (loadError || !content) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">
        {loadError || "Konten tidak tersedia."}
      </div>
    );
  }

  const toastMeta = blockToast ? BLOCK_META[blockToast] : null;

  return (
    <PlayModeProvider mode={playMode}>
      <div className="fx-screen-in space-y-6">
        {showConfetti ? <Confetti onDone={() => setShowConfetti(false)} /> : null}

        {toastMeta && blockToast ? (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div className="fx-pop-in relative flex max-w-md items-center gap-3 rounded-2xl border border-amber-300/40 bg-[#0b1d3a] px-4 py-3 text-white shadow-2xl">
              <span className="text-3xl" aria-hidden>
                {toastMeta.sticker}
              </span>
              <div className="min-w-0">
                <p className="play-display text-sm font-black">{trialT("blockClearTitle", locale)}</p>
                <p className="text-xs text-white/70">
                  {trialT("blockClearBody", locale)}: {L(toastMeta.reward, locale)}
                </p>
              </div>
              <button
                type="button"
                className="ml-2 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => setBlockToast(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className={`overflow-hidden rounded-[28px] bg-gradient-to-r ${content.accentClass} p-[1px]`}>
          <div className="rounded-[27px] bg-[#07111f]/95 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/55">{trialT("playHero", locale)}</p>
                <h2 className="play-display mt-1 text-2xl font-black text-white sm:text-3xl">
                  {L(content.title, locale)}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-white/70">{L(content.subtitle, locale)}</p>
                <p className="mt-2 text-sm font-semibold text-white/80">Hi, {session.student.name}! ✨</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2">
                <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
                <span className="text-sm font-black text-white">
                  {session.stars} {trialT("stars", locale)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(BLOCK_META) as TrialBlock[]).map((block) => {
                const meta = BLOCK_META[block];
                const ids = content.blocks.filter((b) => b.block === block).map((b) => b.id);
                const done = isBlockComplete(questions, ids) || Boolean(session.blockRewards[block]);
                return (
                  <span
                    key={block}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      done ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-300/40" : "bg-white/8 text-white/70"
                    }`}
                  >
                    <span className="text-base leading-none">{done ? meta.sticker : meta.emoji}</span>
                    {L(meta.label, locale)}
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h3 className="play-display text-lg font-black text-white">PPT</h3>
          <button
            type="button"
            onClick={() => onSessionPatch({ showPpt: !session.showPpt })}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10"
          >
            {session.showPpt ? trialT("hideSlides", locale) : trialT("openSlides", locale)}
          </button>
        </div>

        {session.showPpt ? (
          content.hasPpt ? (
            <SlidesViewer url={content.pptEmbedUrl} title={L(content.title, locale)} />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-dashed border-amber-300/40 bg-gradient-to-br from-[#0b1d3a] to-[#122844]">
              <div className="border-b border-white/10 px-5 py-3">
                <p className="play-display text-sm font-black text-amber-200">{trialT("pptSoonTitle", locale)}</p>
                <p className="mt-1 text-xs text-white/55">{trialT("pptSoonBody", locale)}</p>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {content.storyPanels.map((panel, i) => (
                  <div
                    key={i}
                    className="fx-pop-in rounded-2xl border border-white/10 bg-white/5 p-4"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="text-3xl">{panel.emoji}</div>
                    <p className="mt-2 play-display text-sm font-black text-white">{L(panel.title, locale)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">{L(panel.body, locale)}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : null}

        <div className="rounded-[28px] border border-white/10 bg-white p-4 text-[#0b1d3a] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="play-display text-lg font-black">{trialT("questionsTitle", locale)}</h3>
            <p className="text-xs font-bold text-slate-500">
              {settledCount}/{questions.length}
            </p>
          </div>

          <div
            className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={settledCount}
            aria-valuemax={questions.length}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#187eb8] to-cyan-400 transition-all duration-500"
              style={{ width: `${questions.length ? (settledCount / questions.length) * 100 : 0}%` }}
            />
          </div>

          <QuestionRunner
            questions={questions}
            onAnswered={handleAnswered}
            submissionsEndpoint="/api/trialclass/submit"
            autoSpeakQuestionIds={listenQuestionIds}
            listenCueLabel={trialT("listenCue", locale)}
            dialogueQuestionIds={talkQuestionIds}
            talkCueLabel={trialT("talkCue", locale)}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!allSettled}
            title={!allSettled ? trialT("finishHint", locale) : undefined}
            onClick={onFinish}
            className="fx-press inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PartyPopper className="h-4 w-4" />
            {trialT("finish", locale)}
            <Trophy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PlayModeProvider>
  );
}

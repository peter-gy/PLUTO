import {
  AnswerChoice,
  Question,
  ResultItem,
  SurveyResult,
} from './survey.types';
import { groupBy } from '../utils';
import { answerChoiceLabelInverse, questionLabel } from './survey.adapter';
import { choiceByResultItem, questionByName } from '../survey-model';
import { STAT_SCORE_RANGES } from './survey.constants';

/**
 * Returns the counteraction feedback for the supplied {@link SurveyResult} grouped
 * by the impact of the question as well as the scores for the x and y-axis.
 *
 * @param {SurveyResult} result - The survey result to get the feedback for.
 */
export function analyzeResults(result: SurveyResult) {
  const answersPerQuestion = getAnswersPerQuestion(result.items);
  const entriesPerImpact = groupBy(
    answersPerQuestion,
    ({
      question: {
        metadata: { impact },
      },
    }) => impact
  );
  const entriesX = entriesPerImpact['x'];
  const entriesY = entriesPerImpact['y'];

  const feedbackX = feedbackForEntries(entriesX);
  const feedbackY = feedbackForEntries(entriesY);
  const scoreX = scoreForEntries(entriesX);
  const scoreY = scoreForEntries(entriesY);

  const { x: xScoreRange, y: yScoreRange } = STAT_SCORE_RANGES;
  const scoreNormalizedX = normalizeScore(
    scoreX,
    xScoreRange.min,
    xScoreRange.max
  );
  const scoreNormalizedY = normalizeScore(
    scoreY,
    yScoreRange.min,
    yScoreRange.max
  );

  return {
    feedback: {
      x: feedbackX,
      y: feedbackY,
    },
    score: {
      x: scoreX,
      y: scoreY,
    },
    scoreNormalized: {
      x: formatScore(scoreNormalizedX),
      y: formatScore(scoreNormalizedY),
    },
  };
}

export type SurveyResultAnalysis = ReturnType<typeof analyzeResults>;

function formatScore(score: number) {
  return Math.round(score * 100) / 100;
}

/**
 * Returns the normalized score for the supplied `score`, `minScore` and `maxScore`.
 * The result is a number between 0 and 1.
 *
 * @param {number} score - The score to normalize.
 * @param {number} minScore - The minimum score.
 * @param {number} maxScore - The maximum score.
 */
function normalizeScore(score: number, minScore: number, maxScore: number) {
  return (score - minScore) / (maxScore - minScore);
}

type ResultItemsWithQuestion = {
  question: Question;
  items: ResultItemWithChoice[];
};

function scoreForEntries(entries: ResultItemsWithQuestion[]) {
  return entries.reduce(
    (acc, { items }) => acc + getScoreForAnsweredQuestion(items),
    0
  );
}

function getScoreForAnsweredQuestion(items: ResultItemWithChoice[]) {
  return items.reduce((acc, { choice: { score } }) => acc + score, 0);
}

function feedbackForEntries(entries: ResultItemsWithQuestion[]) {
  return entries.flatMap(({ question, items }) =>
    getFeedbackForAnsweredQuestion(question, items)
  );
}

type ResultItemWithChoice = {
  resultItem: ResultItem;
  choice: AnswerChoice;
};

function resultItemWithChoice(
  question: Question,
  resultItem: ResultItem
): ResultItemWithChoice {
  const choice = choiceByResultItem(question, resultItem);
  return { resultItem, choice };
}

/**
 * Associates each {@link ResultItem} with the {@link Question} instance it belongs to so that
 * we can augment the partial result attributes collected from a SurveyJS submission with the
 * custom data we have in our custom model.
 *
 * @param {ResultItem[]} resultItems - The result items to associate with their questions.
 */
function getAnswersPerQuestion(resultItems: ResultItem[]) {
  const answersPerQuestionGroup = groupBy(resultItems, ({ choice }) => {
    const { questionNumber } = answerChoiceLabelInverse(choice);
    return questionLabel(questionNumber);
  });
  return Object.entries(answersPerQuestionGroup).map(
    ([questionName, answers]) => {
      const question = questionByName(questionName);
      const items = answers.map((resultItem) =>
        resultItemWithChoice(question, resultItem)
      );
      return { question, items };
    }
  );
}

/**
 * Returns the feedback for a question based on the supplied {@link ResultItem}s.
 * Individual feedback items get added if a specific {@link AnswerChoice} has
 * feedback defined and has been selected.
 *
 * The ``coreFeedback`` is added if an answer item with a non-positive score has been selected.
 *
 * @param {Question} question - The question to get the feedback for.
 * @param {ResultItemWithChoice[]} items - The result items to get the feedback for.
 */
function getFeedbackForAnsweredQuestion(
  question: Question,
  items: ResultItemWithChoice[]
) {
  const {
    metadata: { feedback: coreFeedback },
  } = question;
  const individualFeedback = items
    .map(({ choice: { feedback } }) => feedback)
    .filter(Boolean) as string[];
  const itemsWithNonPositiveScore = items.find(
    ({ choice: { score }, resultItem: { type } }) =>
      type !== 'none' && score <= 0
  );
  const shouldIncludeCoreFeedback = itemsWithNonPositiveScore !== undefined;
  const feedback = shouldIncludeCoreFeedback
    ? [coreFeedback, ...individualFeedback]
    : individualFeedback;
  return feedback.filter(Boolean) as string[];
}

from dataclasses import dataclass


@dataclass
class SelectionRange:
    start: int
    end: int

    @staticmethod
    def from_dict(d: dict):
        return SelectionRange(d['start'], d['end'])


@dataclass
class AnswerChoice:
    body: str
    score: float

    @staticmethod
    def from_dict(d: dict):
        return AnswerChoice(d['body'], d['score'])


@dataclass
class Question:
    body: str
    selection_range: SelectionRange
    choices: list[AnswerChoice]

    @staticmethod
    def from_dict(d: dict):
        return Question(
            d['body'],
            SelectionRange.from_dict(d['selection_range']),
            [AnswerChoice.from_dict(c) for c in d['choices']],
        )


@dataclass
class Section:
    title: str
    questions: list[Question]

    @staticmethod
    def from_dict(d: dict):
        return Section(
            d['title'],
            [Question.from_dict(q) for q in d['questions']],
        )


@dataclass
class Questionnaire:
    title: str
    sections: list[Section]

    @staticmethod
    def from_dict(d: dict):
        return Questionnaire(
            d['title'],
            [Section.from_dict(s) for s in d['sections']],
        )


@dataclass
class ResponseRow:
    section_id: str
    section_title: str
    question_id: str
    question_body: str
    choices: list[AnswerChoice]
    min_sum: float
    max_sum: float
    score_sum: float

    @staticmethod
    def from_dict(d: dict):
        return ResponseRow(
            d['section_id'],
            d['section_title'],
            d['question_id'],
            d['question_body'],
            [AnswerChoice.from_dict(c) for c in d['choices']],
            d['min_sum'],
            d['max_sum'],
            d['score_sum'],
        )
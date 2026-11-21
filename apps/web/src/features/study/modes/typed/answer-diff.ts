export interface AnswerDiff {
  before: string;
  wrong: string;
  after: string;
}

const comparable = (value: string) => value.normalize('NFC').toLowerCase();

/** Tách phần khác đáp án bằng cách bỏ đoạn đầu và đoạn cuối trùng nhau. */
export function diffAnswer(answer: string, expected: string): AnswerDiff {
  const given = Array.from(answer.trim().normalize('NFC'));
  const givenKeys = given.map(comparable);
  const target = Array.from(comparable(expected.trim()));

  let start = 0;
  while (start < given.length && givenKeys[start] === target[start]) {
    start += 1;
  }
  let end = 0;
  while (
    end < given.length - start &&
    end < target.length - start &&
    givenKeys[given.length - 1 - end] === target[target.length - 1 - end]
  ) {
    end += 1;
  }

  return {
    before: given.slice(0, start).join(''),
    wrong: given.slice(start, given.length - end).join(''),
    after: given.slice(given.length - end).join(''),
  };
}

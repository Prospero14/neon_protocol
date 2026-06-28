import { describe, expect, it } from 'vitest';
import {
  breachPickAllowed,
  generateBreachMatrix,
  generateBreachRun,
  generateHexSecret,
  hashCrackChoices,
  inPctZone,
  portSequenceComplete,
  scoreGuess,
  seededShuffle,
  seqNoRepeat,
} from './iceMiniGameLogic.js';
import { getIceGame, resolveIceParams, NRI_GAME_CATALOG } from './nriGameCatalog.js';

describe('seededShuffle — детерминизм и устойчивость', () => {
  it('один seed → один порядок', () => {
    const a = seededShuffle([1, 2, 3, 4, 5], 42);
    const b = seededShuffle([1, 2, 3, 4, 5], 42);
    expect(a).toEqual(b);
  });

  it('разные seed → обычно разный порядок', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 1);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 2);
    expect(a).not.toEqual(b);
  });

  it('пустой массив не падает', () => {
    expect(seededShuffle([], 999)).toEqual([]);
  });

  it('один элемент возвращает копию', () => {
    expect(seededShuffle(['x'], 0)).toEqual(['x']);
  });
});

describe('seqNoRepeat — без повторов подряд', () => {
  it('не ставит одинаковые индексы подряд при poolSize > 1', () => {
    for (let seed = 0; seed < 20; seed++) {
      const seq = seqNoRepeat(8, 5, seed);
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i]).not.toBe(seq[i - 1]);
      }
    }
  });

  it('длина 0 → пустой массив', () => {
    expect(seqNoRepeat(0, 4, 1)).toEqual([]);
  });

  it('poolSize 1 всё равно возвращает len элементов', () => {
    expect(seqNoRepeat(3, 1, 5)).toEqual([0, 0, 0]);
  });

  it('индексы в пределах poolSize', () => {
    const seq = seqNoRepeat(10, 6, 12345);
    for (const idx of seq) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(6);
    }
  });
});

describe('scoreGuess — Auth Bypass (Wordle)', () => {
  it('полное совпадение → все exact', () => {
    expect(scoreGuess('root', 'root')).toEqual(['exact', 'exact', 'exact', 'exact']);
  });

  it('полностью неверное слово → все absent', () => {
    expect(scoreGuess('root', 'wxyz')).toEqual(['absent', 'absent', 'absent', 'absent']);
  });

  it('буква есть в слове, но не на месте → present', () => {
    const marks = scoreGuess('root', 'oxxx');
    expect(marks[0]).toBe('present');
    expect(marks.filter((m) => m === 'exact').length).toBe(0);
  });

  it('дубликаты в guess учитывают лимит secret', () => {
    const marks = scoreGuess('aab', 'aaa');
    expect(marks[0]).toBe('exact');
    expect(marks[1]).toBe('exact');
    expect(marks[2]).toBe('absent');
  });

  it('кириллица не ломает разметку', () => {
    const marks = scoreGuess('дека', 'дека');
    expect(marks.every((m) => m === 'exact')).toBe(true);
  });

  it('пустой guess → пустые marks', () => {
    expect(scoreGuess('root', '')).toEqual([]);
  });

  it('guess длиннее secret — только по длине guess (вызывающий код режет)', () => {
    const marks = scoreGuess('ab', 'abc');
    expect(marks).toHaveLength(3);
  });
});

describe('generateHexSecret + hashCrackChoices', () => {
  it('длина секрета совпадает с hashLen', () => {
    expect(generateHexSecret(8, 100).length).toBe(8);
    expect(generateHexSecret(0, 100)).toBe('');
  });

  it('choices всегда содержат верный символ и ровно 4 варианта', () => {
    const secret = generateHexSecret(6, 555);
    for (let pos = 0; pos < secret.length; pos++) {
      const choices = hashCrackChoices(secret, pos, 777);
      expect(choices).toHaveLength(4);
      expect(choices).toContain(secret[pos]);
      expect(new Set(choices).size).toBe(4);
    }
  });

  it('pos за пределами secret не падает (undefined в choices)', () => {
    expect(() => hashCrackChoices('ab', 99, 1)).not.toThrow();
  });
});

describe('breach matrix helpers', () => {
  it('generateBreachRun path respects alternating axis rule', () => {
    const matrix = generateBreachMatrix(5, 5, 42);
    const { target, path } = generateBreachRun(matrix, 4, 99);
    expect(target).toHaveLength(4);
    expect(path).toHaveLength(4);
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!;
      expect(p.code).toBe(matrix[p.row]![p.col]);
      expect(breachPickAllowed(p.row, p.col, i, i > 0 ? path[i - 1]! : null)).toBe(true);
    }
  });

  it('breachPickAllowed enforces first row only on step 0', () => {
    expect(breachPickAllowed(0, 2, 0, null)).toBe(true);
    expect(breachPickAllowed(2, 2, 0, null)).toBe(false);
  });
});

describe('inPctZone — Buffer Flood / Signal Lock', () => {
  it('value внутри зоны', () => {
    expect(inPctZone(60, 52, 14)).toBe(true);
  });

  it('value на границе зоны', () => {
    expect(inPctZone(52, 52, 14)).toBe(true);
    expect(inPctZone(66, 52, 14)).toBe(true);
  });

  it('value вне зоны', () => {
    expect(inPctZone(51, 52, 14)).toBe(false);
    expect(inPctZone(67, 52, 14)).toBe(false);
  });

  it('отрицательная зона не ломает сравнение', () => {
    expect(inPctZone(0, -5, 10)).toBe(true);
  });
});

describe('portSequenceComplete', () => {
  it('полное совпадение → true', () => {
    expect(portSequenceComplete([443, 8080, 22], [443, 8080, 22])).toBe(true);
  });

  it('ошибка в середине → false', () => {
    expect(portSequenceComplete([443, 8080, 22], [443, 22, 22])).toBe(false);
  });

  it('неполный ввод → false', () => {
    expect(portSequenceComplete([443, 8080], [443])).toBe(false);
  });

  it('пустые массивы → true (degenerate win)', () => {
    expect(portSequenceComplete([], [])).toBe(true);
  });
});

describe('resolveIceParams — нехватка / битые id', () => {
  it('null для неизвестной игры', () => {
    expect(resolveIceParams('', 'easy')).toBeNull();
    expect(resolveIceParams('unknown_game', 'hard')).toBeNull();
    expect(resolveIceParams('zero_day_chain', 'medium')).toBeNull();
  });

  it('все catalog id возвращают params для easy/medium/hard', () => {
    for (const g of NRI_GAME_CATALOG) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        const p = resolveIceParams(g.id, d);
        expect(p, `${g.id}/${d}`).not.toBeNull();
        expect(p!.maxMistakes).toBeGreaterThanOrEqual(0);
        expect(p!.traceSpeed).toBeGreaterThan(0);
      }
    }
  });

  it('getIceGame undefined для мусора', () => {
    expect(getIceGame('')).toBeUndefined();
    expect(getIceGame('PORT_SWEEP')).toBeUndefined();
  });
});

describe('NRI_GAME_CATALOG — guide и blurb не пустые', () => {
  it('каждая игра имеет guide.how/win/fail', () => {
    for (const g of NRI_GAME_CATALOG) {
      expect(g.guide.how.length, g.id).toBeGreaterThan(10);
      expect(g.guide.win.length, g.id).toBeGreaterThan(10);
      expect(g.guide.fail.length, g.id).toBeGreaterThan(10);
      expect(g.blurb.length, g.id).toBeGreaterThan(5);
    }
  });
});

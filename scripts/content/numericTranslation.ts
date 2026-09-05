const NUMBER_TOKEN = /(?<![\p{L}\p{N}])[-+]?(?:\d{1,3}(?:[ ,.\u00A0]\d{3})+|\d+)(?:[.,]\d+)?(?:\s?(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml)(?![\p{L}\p{N}]|\.\p{L}))?/giu;

const ENGLISH_SMALL = new Map<string, number>([
  ['zero', 0], ['zeroth', 0],
  ['one', 1], ['first', 1], ['two', 2], ['second', 2], ['three', 3], ['third', 3],
  ['four', 4], ['fourth', 4], ['five', 5], ['fifth', 5], ['six', 6], ['sixth', 6],
  ['seven', 7], ['seventh', 7], ['eight', 8], ['eighth', 8], ['nine', 9], ['ninth', 9],
  ['ten', 10], ['tenth', 10], ['eleven', 11], ['eleventh', 11], ['twelve', 12], ['twelfth', 12],
  ['thirteen', 13], ['thirteenth', 13], ['fourteen', 14], ['fourteenth', 14],
  ['fifteen', 15], ['fifteenth', 15], ['sixteen', 16], ['sixteenth', 16],
  ['seventeen', 17], ['seventeenth', 17], ['eighteen', 18], ['eighteenth', 18],
  ['nineteen', 19], ['nineteenth', 19],
]);

const ENGLISH_TENS = new Map<string, number>([
  ['twenty', 20], ['twentieth', 20], ['thirty', 30], ['thirtieth', 30],
  ['forty', 40], ['fortieth', 40], ['fifty', 50], ['fiftieth', 50],
  ['sixty', 60], ['sixtieth', 60], ['seventy', 70], ['seventieth', 70],
  ['eighty', 80], ['eightieth', 80], ['ninety', 90], ['ninetieth', 90],
]);

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function normalizeNumericPunctuation(value: string): string {
  return value
    .replace(/\b(\d{2})(\d{2})\b\.?\s*([–—])\s*(\d{2})\b\.?/gu, (_match, century: string, year: string, separator: string, end: string) => {
      const startYear = Number(`${century}${year}`);
      let endYear = Number(`${century}${end}`);
      if (endYear < startYear) endYear += 100;
      return `${startYear}${separator}${endYear}`;
    })
    .replace(/\b(\d{1,2}):(\d{2})[.:](\d{2})\b/gu, '$1 $2 $3');
}

function canonicalDigitNumbers(value: string): string[] {
  const matches = normalizeNumericPunctuation(value).match(NUMBER_TOKEN) ?? [];
  return matches.map((raw) => {
    const unit = raw.match(/(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml)$/iu)?.[0]?.toLowerCase() ?? '';
    let number = raw.slice(0, raw.length - unit.length).trim().replace(/\s+/g, '');
    const comma = number.lastIndexOf(',');
    const dot = number.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? ',' : '.';
      number = number.replace(decimal === ',' ? /\./g : /,/g, '').replace(decimal, '.');
    } else if (comma >= 0) {
      const digits = number.length - comma - 1;
      number = digits === 3 ? number.replace(/,/g, '') : number.replace(',', '.');
    } else if (dot >= 0 && number.length - dot - 1 === 3) number = number.replace(/\./g, '');
    return `${number}${unit}`;
  }).sort(compareCodeUnits);
}

function englishWordNumbers(value: string): string[] {
  const tokens = value.normalize('NFKC').toLocaleLowerCase('en').replace(/[‐‑‒–—-]/gu, ' ').match(/\p{L}+/gu) ?? [];
  const numbers: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const small = ENGLISH_SMALL.get(tokens[index]);
    const tens = ENGLISH_TENS.get(tokens[index]);
    if (small !== undefined || tens !== undefined) {
      let phraseEnd = index;
      let hasMagnitude = false;
      while (phraseEnd < tokens.length) {
        const token = tokens[phraseEnd];
        const isMagnitude = /^(?:thousand|million|billion)$/u.test(token);
        const isNumberPart = ENGLISH_SMALL.has(token) || ENGLISH_TENS.has(token)
          || token === 'hundred' || token === 'and' || isMagnitude;
        if (!isNumberPart) break;
        hasMagnitude ||= isMagnitude;
        phraseEnd += 1;
      }
      if (hasMagnitude) {
        index = phraseEnd - 1;
        continue;
      }
    }
    if (small !== undefined && small > 0 && small < 10 && tokens[index + 1] === 'hundred') {
      let valueAtIndex = small * 100;
      let consumed = 1;
      const connector = tokens[index + 2] === 'and' ? 1 : 0;
      const trailingTens = ENGLISH_TENS.get(tokens[index + 2 + connector]);
      const trailingSmall = ENGLISH_SMALL.get(tokens[index + 2 + connector]);
      if (trailingTens !== undefined) {
        valueAtIndex += trailingTens;
        consumed += 1 + connector;
        const trailingOne = ENGLISH_SMALL.get(tokens[index + 3 + connector]);
        if (trailingOne !== undefined && trailingOne < 10) { valueAtIndex += trailingOne; consumed += 1; }
      } else if (trailingSmall !== undefined) {
        valueAtIndex += trailingSmall;
        consumed += 1 + connector;
      }
      numbers.push(String(valueAtIndex));
      index += consumed;
    } else if (tens !== undefined) {
      const trailing = ENGLISH_SMALL.get(tokens[index + 1]);
      if (trailing !== undefined && trailing < 10) { numbers.push(String(tens + trailing)); index += 1; }
      else numbers.push(String(tens));
    } else if (small !== undefined) numbers.push(String(small));
  }
  return numbers;
}

function estonianWordValue(token: string): number | undefined {
  if (/^(?:sada|saja|sajast|sadat|sajale|sajaga)$/u.test(token)) return 100;
  if (/^esikümn/u.test(token)) return 10;
  if (/^(?:üheksateist|üheksateistkümn)\p{L}*$/u.test(token)) return 19;
  if (/^(?:kaheksateist|kaheksateistkümn)\p{L}*$/u.test(token)) return 18;
  if (/^(?:seitseteist|seitsmeteistkümn)\p{L}*$/u.test(token)) return 17;
  if (/^(?:kuusteist|kuueteistkümn)\p{L}*$/u.test(token)) return 16;
  if (/^(?:viisteist|viieteistkümn)\p{L}*$/u.test(token)) return 15;
  if (/^(?:neliteist|neljateistkümn)\p{L}*$/u.test(token)) return 14;
  if (/^(?:kolmteist|kolmeteistkümn)\p{L}*$/u.test(token)) return 13;
  if (/^(?:kaksteist|kaheteistkümn)\p{L}*$/u.test(token)) return 12;
  if (/^(?:üksteist|üheteistkümn)\p{L}*$/u.test(token)) return 11;
  if (/^(?:üheksakümmend|üheksakümn)\p{L}*$/u.test(token)) return 90;
  if (/^(?:kaheksakümmend|kaheksakümn)\p{L}*$/u.test(token)) return 80;
  if (/^(?:seitsekümmend|seitsmekümn)\p{L}*$/u.test(token)) return 70;
  if (/^(?:kuuskümmend|kuuekümn)\p{L}*$/u.test(token)) return 60;
  if (/^(?:viiskümmend|viiekümn)\p{L}*$/u.test(token)) return 50;
  if (/^(?:nelikümmend|neljakümn)\p{L}*$/u.test(token)) return 40;
  if (/^(?:kolmkümmend|kolmekümn)\p{L}*$/u.test(token)) return 30;
  if (/^(?:kakskümmend|kahekümn)\p{L}*$/u.test(token)) return 20;
  if (/^(?:kümme|kümne|kümnest|kümmet|kümnel|kümnes|kümnele|kümnega|kümneks|kümnend\p{L}*)$/u.test(token)) return 10;
  if (/^(?:üheksa|üheksast|üheksat|üheksal|üheksale|üheksaga|üheksaks|üheksand\p{L}*)$/u.test(token)) return 9;
  if (/^(?:kaheksa|kaheksast|kaheksat|kaheksal|kaheksale|kaheksaga|kaheksaks|kaheksand\p{L}*)$/u.test(token)) return 8;
  if (/^(?:seitse|seitsme|seitsmest|seitset|seitsmel|seitsmele|seitsmega|seitsmeks|seitsmend\p{L}*)$/u.test(token)) return 7;
  if (/^(?:kuus|kuue|kuuest|kuut|kuuel|kuuele|kuuega|kuueks|kuuend\p{L}*)$/u.test(token)) return 6;
  if (/^(?:viis|viie|viiest|viit|viiel|viiele|viiega|viieks|viiend\p{L}*)$/u.test(token)) return 5;
  if (/^(?:neli|nelja|neljast|nelja|neljal|neljale|neljaga|neljaks|neljand\p{L}*)$/u.test(token)) return 4;
  if (/^(?:kolm|kolme|kolmest|kolme|kolmel|kolmele|kolmega|kolmeks|kolmand\p{L}*)$/u.test(token)) return 3;
  if (/^(?:kaks|kahe|kahest|kaht|kahel|kahele|kahega|kaheks|teine|teise|teisest|teist|teisel|teisele|teisega|teiseks|teisena)$/u.test(token)) return 2;
  if (/^(?:üks|ühe|ühest|üht|ühel|ühele|ühega|üheks|esimene|esimese|esimesest|esimest|esimesel|esimesele|esimesega|esimeseks|esimesena)$/u.test(token)) return 1;
  return undefined;
}

function estonianWordNumbers(value: string): string[] {
  const numbers: string[] = [];
  const tokens = value.normalize('NFKC').toLocaleLowerCase('et').replace(/[‐‑‒–—-]/gu, ' ').match(/\p{L}+/gu) ?? [];
  for (let index = 0; index < tokens.length; index += 1) {
    const current = estonianWordValue(tokens[index]);
    if (current === undefined) continue;
    let phraseEnd = index;
    let hasMagnitude = false;
    while (phraseEnd < tokens.length) {
      const token = tokens[phraseEnd];
      const isMagnitude = /^(?:tuhat|tuhande\p{L}*|miljon\p{L}*|miljard\p{L}*)$/u.test(token);
      const isNumberPart = estonianWordValue(token) !== undefined || token === 'ja' || isMagnitude;
      if (!isNumberPart) break;
      hasMagnitude ||= isMagnitude;
      phraseEnd += 1;
    }
    if (hasMagnitude) {
      index = phraseEnd - 1;
      continue;
    }
    const trailing = estonianWordValue(tokens[index + 1] ?? '');
    if (current >= 20 && current % 10 === 0 && trailing !== undefined && trailing < 10) {
      numbers.push(String(current + trailing));
      index += 1;
    } else numbers.push(String(current));
  }
  const romanType = value.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\.?\s+tüüpi\b/gu) ?? [];
  const romanValues: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  for (const match of romanType) numbers.push(String(romanValues[match.match(/^[IVX]+/u)?.[0] ?? '']));
  return numbers;
}

const WORD_UNIT_MATCHERS: readonly { unit: string; pattern: RegExp }[] = [
  { unit: 'pp', pattern: /\b(?:percentage[\s‐‑‒–—-]+points?|protsendipunkt\p{L}*)\b/giu },
  { unit: '°c', pattern: /\b(?:degrees?\s+celsius|celsius\s+degrees?|celsiuse\s+kraad\p{L}*)\b/giu },
  { unit: '°f', pattern: /\b(?:degrees?\s+fahrenheit|fahrenheit\s+degrees?|fahrenheiti\s+kraad\p{L}*)\b/giu },
  { unit: 'km/h', pattern: /\b(?:kilometers?|kilometres?)\s+per\s+hour\b|\bkilomeetr\p{L}*\s+tunnis\b/giu },
  { unit: 'mph', pattern: /\bmiles?\s+per\s+hour\b|\bmiili\p{L}*\s+tunnis\b/giu },
  { unit: '%', pattern: /\b(?:percent(?:age)?|per\s+cent|protsen[td]\p{L}*)\b/giu },
  { unit: 'km', pattern: /\b(?:kilometers?|kilometres?|kilomeetr\p{L}*)\b/giu },
  { unit: 'cm', pattern: /\b(?:centimeters?|centimetres?|sentimeetr\p{L}*)\b/giu },
  { unit: 'mm', pattern: /\b(?:millimeters?|millimetres?|millimeetr\p{L}*)\b/giu },
  { unit: 'kg', pattern: /\b(?:kilograms?|kilogramm\p{L}*)\b/giu },
  { unit: 'mg', pattern: /\b(?:milligrams?|milligramm\p{L}*)\b/giu },
  { unit: 'ml', pattern: /\b(?:milliliters?|millilitres?|milliliitr\p{L}*)\b/giu },
  { unit: 'm', pattern: /\b(?:meters?|metres?|meetr\p{L}*)\b/giu },
  { unit: 'g', pattern: /\b(?:grams?|gramm(?:i|e)\p{L}*|gramm)\b/giu },
  { unit: 'l', pattern: /\b(?:liters?|litres?|liitr\p{L}*)\b/giu },
  { unit: '°', pattern: /\b(?:degrees?|kraad\p{L}*)\b/giu },
];

interface TrailingNumber {
  value: string;
  source: 'digit' | 'word';
}

function isNumberWordPart(token: string, language: 'en' | 'et'): boolean {
  if (language === 'en') {
    return ENGLISH_SMALL.has(token) || ENGLISH_TENS.has(token)
      || token === 'hundred' || token === 'and'
      || /^(?:thousand|million|billion)$/u.test(token);
  }
  return estonianWordValue(token) !== undefined || token === 'ja'
    || /^(?:tuhat|tuhande\p{L}*|miljon\p{L}*|miljard\p{L}*)$/u.test(token);
}

function trailingNumber(value: string, language: 'en' | 'et'): TrailingNumber | undefined {
  let scopeStart = 0;
  for (const boundary of value.matchAll(/[.?!;:](?=\s|$)/gu)) scopeStart = boundary.index + 1;
  const scope = value.slice(scopeStart).replace(/[‐‑‒–—-]\s*$/u, '');
  const digit = /(?<![\p{L}\p{N}/])([-+]?(?:\d{1,3}(?:[ ,.\u00A0]\d{3})+|\d+)(?:[.,]\d+)?)\s*$/u.exec(scope);
  if (digit?.[1]) {
    const canonical = canonicalDigitNumbers(digit[1]);
    if (canonical.length === 1) return { value: canonical[0], source: 'digit' };
  }
  const tokens = scope.normalize('NFKC').toLocaleLowerCase(language).match(/\p{L}+/gu) ?? [];
  let start = tokens.length;
  while (start > 0 && isNumberWordPart(tokens[start - 1], language)) start -= 1;
  if (start === tokens.length) return undefined;
  const phrase = tokens.slice(start).join(' ');
  const values = language === 'en' ? englishWordNumbers(phrase) : estonianWordNumbers(phrase);
  return values.length === 1 ? { value: values[0], source: 'word' } : undefined;
}

function extractAtomicWordUnits(
  value: string,
  language: 'en' | 'et',
  digitNumbers: string[],
  wordNumbers: string[],
): string[] {
  const occupied: { start: number; end: number }[] = [];
  const atomic: string[] = [];
  const coordinatedPercent = language === 'en'
    ? /(?<![\p{L}\p{N}])([-+]?\d+(?:[.,]\d+)?)\s+(?:to|versus|vs\.?)\s+([-+]?\d+(?:[.,]\d+)?)\s+(?:percent|per\s+cent)\b/giu
    : /(?<![\p{L}\p{N}])([-+]?\d+(?:[.,]\d+)?)\s+protsen[td]\p{L}*\s+([-+]?\d+(?:[.,]\d+)?)\s+vastu\b/giu;
  for (const match of value.matchAll(coordinatedPercent)) {
    const first = canonicalDigitNumbers(match[1] ?? '');
    const second = canonicalDigitNumbers(match[2] ?? '');
    if (first.length !== 1 || second.length !== 1) continue;
    removeOne(digitNumbers, first[0]);
    removeOne(digitNumbers, second[0]);
    atomic.push(`${first[0]}%`, `${second[0]}%`);
    occupied.push({ start: match.index, end: match.index + match[0].length });
  }
  for (const { unit, pattern } of WORD_UNIT_MATCHERS) {
    for (const match of value.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (occupied.some((range) => start < range.end && end > range.start)) continue;
      const number = trailingNumber(value.slice(0, start), language);
      if (number === undefined) continue;
      removeOne(number.source === 'digit' ? digitNumbers : wordNumbers, number.value);
      atomic.push(`${number.value}${unit}`);
      occupied.push({ start, end });
    }
  }
  return atomic;
}

function takeWordEquivalent(number: string, words: string[]): boolean {
  if (!/^\d+$/u.test(number)) return false;
  const index = words.indexOf(number);
  if (index < 0) return false;
  words.splice(index, 1);
  return true;
}

function removeOne(numbers: string[], value: string): void {
  const index = numbers.indexOf(value);
  if (index >= 0) numbers.splice(index, 1);
}

function cancelSharedNumbers(left: string[], right: string[]): void {
  for (let index = left.length - 1; index >= 0; index -= 1) {
    const matching = right.indexOf(left[index]);
    if (matching < 0) continue;
    left.splice(index, 1);
    right.splice(matching, 1);
  }
}

export function differsNumerically(english: string, estonian: string): boolean {
  const englishNumbers = canonicalDigitNumbers(english);
  const estonianNumbers = canonicalDigitNumbers(estonian);
  const englishWords = englishWordNumbers(english);
  const estonianWords = estonianWordNumbers(estonian);
  englishNumbers.push(...extractAtomicWordUnits(english, 'en', englishNumbers, englishWords));
  estonianNumbers.push(...extractAtomicWordUnits(estonian, 'et', estonianNumbers, estonianWords));
  englishNumbers.sort(compareCodeUnits);
  estonianNumbers.sort(compareCodeUnits);
  const englishNormalized = english.normalize('NFKC').toLocaleLowerCase('en');
  const estonianNormalized = estonian.normalize('NFKC').toLocaleLowerCase('et');
  const booksOfMoses: readonly [RegExp, string][] = [
    [/\b(?:book of )?genesis\b/u, '1'],
    [/\b(?:book of )?exodus\b/u, '2'],
    [/\b(?:book of )?leviticus\b/u, '3'],
    [/\b(?:the )?book of numbers\b/u, '4'],
    [/\b(?:book of )?deuteronomy\b/u, '5'],
  ];
  for (const [book, number] of booksOfMoses) {
    if (book.test(englishNormalized)
      && new RegExp(`(?:^|[^\\p{L}\\p{N}])${number}\\.\\s*moosese\\b`, 'u').test(estonianNormalized)) {
      removeOne(estonianNumbers, number);
    }
  }
  cancelSharedNumbers(englishNumbers, estonianNumbers);
  if (englishNumbers.length === 0 && estonianNumbers.length === 0) return false;
  for (let index = englishNumbers.length - 1; index >= 0; index -= 1) {
    if (takeWordEquivalent(englishNumbers[index], estonianWords)) englishNumbers.splice(index, 1);
  }
  for (let index = estonianNumbers.length - 1; index >= 0; index -= 1) {
    if (takeWordEquivalent(estonianNumbers[index], englishWords)) estonianNumbers.splice(index, 1);
  }
  return englishNumbers.length !== 0 || estonianNumbers.length !== 0;
}

function uniqueAnswers(answers: readonly string[]): string[] {
  return [...new Set(answers.map((answer) => answer.trim()).filter((answer) => answer !== ''))];
}

export function answerFamiliesDifferNumerically(
  englishAnswers: readonly string[],
  estonianAnswers: readonly string[],
): boolean {
  const englishFamily = uniqueAnswers(englishAnswers);
  const estonianFamily = uniqueAnswers(estonianAnswers);
  const englishNumericAnswers = englishFamily.filter((answer) => differsNumerically(answer, ''));
  const estonianNumericAnswers = estonianFamily.filter((answer) => differsNumerically('', answer));

  return englishNumericAnswers.some((english) =>
    !estonianFamily.some((estonian) => !differsNumerically(english, estonian)))
    || estonianNumericAnswers.some((estonian) =>
      !englishFamily.some((english) => !differsNumerically(english, estonian)));
}

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildEasyExpansionCorpus,
  combineEasyExpansionBanks,
  getEasyExpansionBank,
  type EasyExpansionBankRegistration,
} from "../../../scripts/content/easyExpansion/bank";
import type {
  EasyExpansionCategory,
  EasyExpansionQuestion,
} from "../../../scripts/content/easyExpansion/types";

function question(
  batchId: string,
  packId: string,
  categoryIndex: number,
  questionIndex: number,
): EasyExpansionQuestion {
  const ordinal = categoryIndex * 5 + questionIndex + 1;
  return {
    clueId: `${packId}-easy-expansion-${ordinal.toString().padStart(3, "0")}`,
    key: `${batchId}-question-${ordinal}`,
    factKey: `${batchId}:fact:${ordinal}`,
    tier: (questionIndex + 1) as 1 | 2 | 3 | 4 | 5,
    subjectKey: `${batchId}:subject:${ordinal}`,
    clue: { en: `Clue ${ordinal}`, et: `Vihje ${ordinal}` },
    response: { en: `Answer ${ordinal}`, et: `Vastus ${ordinal}` },
    acceptedVariants: { en: [], et: [] },
    explanation: { en: `Explanation ${ordinal}`, et: `Selgitus ${ordinal}` },
    source: {
      sourceId: `${batchId}-source-${ordinal}`,
      title: `Source ${ordinal}`,
      url: `https://example.com/${batchId}/${ordinal}`,
      license: "CC-BY-4.0",
      retrievedAt: "2026-09-06",
    },
  };
}

function bank(batchId: string, packId: string): EasyExpansionBankRegistration {
  return {
    batchId,
    categories: Array.from(
      { length: 20 },
      (_, categoryIndex): EasyExpansionCategory => ({
        categorySetId: `${packId}-set-${101 + categoryIndex}`,
        batchId,
        packId,
        difficulty: "easy",
        round: categoryIndex < 10 ? "round-one" : "round-two",
        macroTopic: `${batchId}-topic`,
        name: {
          en: `${batchId} category ${categoryIndex + 1}`,
          et: `${batchId} kategooria ${categoryIndex + 1}`,
        },
        questions: Array.from({ length: 5 }, (_, questionIndex) =>
          question(batchId, packId, categoryIndex, questionIndex),
        ),
      }),
    ).reverse(),
  };
}

function replaceCategory(
  registration: EasyExpansionBankRegistration,
  index: number,
  replacement: EasyExpansionCategory,
): EasyExpansionBankRegistration {
  return {
    ...registration,
    categories: registration.categories.map((category, categoryIndex) =>
      categoryIndex === index ? replacement : category,
    ),
  };
}

describe("Easy expansion bank registry", () => {
  it("registers the complete History through Film & Television banks as a stable frozen corpus", () => {
    const corpus = buildEasyExpansionCorpus();
    const questions = corpus.flatMap(({ questions }) => questions);

    expect(corpus).toHaveLength(140);
    expect(questions).toHaveLength(700);
    expect(corpus.map(({ categorySetId }) => categorySetId)).toEqual([
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-history-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-geography-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-science-nature-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-literature-language-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-art-architecture-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-music-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-film-television-set-${101 + index}`,
      ),
    ]);
    expect(questions.map(({ clueId }) => clueId)).toEqual([
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-history-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-geography-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-science-nature-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-literature-language-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-art-architecture-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-music-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) =>
          `built-in-film-television-easy-expansion-${(index + 1).toString().padStart(3, "0")}`,
      ),
    ]);
    expect(corpus.filter(({ round }) => round === "round-one")).toHaveLength(
      70,
    );
    expect(corpus.filter(({ round }) => round === "round-two")).toHaveLength(
      70,
    );
    expect(Object.isFrozen(corpus)).toBe(true);
    expect(buildEasyExpansionCorpus()).toBe(corpus);
    expect(getEasyExpansionBank("01-history")).toEqual(corpus.slice(0, 20));
    expect(getEasyExpansionBank("02-geography")).toEqual(corpus.slice(20, 40));
    expect(getEasyExpansionBank("03-science-nature")).toEqual(
      corpus.slice(40, 60),
    );
    expect(getEasyExpansionBank("04-literature-language")).toEqual(
      corpus.slice(60, 80),
    );
    expect(getEasyExpansionBank("05-art-architecture")).toEqual(
      corpus.slice(80, 100),
    );
    expect(getEasyExpansionBank("06-music")).toEqual(corpus.slice(100, 120));
    expect(getEasyExpansionBank("07-film-television")).toEqual(
      corpus.slice(120),
    );
    expect(() => getEasyExpansionBank("08-sports-games")).toThrowError(
      'No Easy expansion bank registered for batch "08-sports-games".',
    );
  });

  it.each([
    ["History", "01-history"],
    ["Geography", "02-geography"],
    ["Science & Nature", "03-science-nature"],
    ["Literature & Language", "04-literature-language"],
    ["Art & Architecture", "05-art-architecture"],
    ["Music", "06-music"],
    ["Film & Television", "07-film-television"],
  ])(
    "binds the completed %s review manifest to the current bank",
    (_name, batchId) => {
      const manifestPath = resolve(
        `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/${batchId}.json`,
      );
      const bankPath = resolve(
        `scripts/content/easyExpansion/banks/${batchId}.ts`,
      );
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        version: number;
        batchId: string;
        baseCommit: string;
        bankSha256: string;
        projectedArtifactHashes: Record<
          "authored" | "generated" | "evidence",
          string
        >;
        reviewers: Record<
          "factual" | "playability" | "estonian" | "release",
          string
        >;
        reviewedCounts: { clues: number; categories: number; sources: number };
        sourceDisposition: { checked: number; passed: number; failed: number };
        collisionDispositions: unknown[];
        finalSeverityCounts: {
          critical: number;
          important: number;
          minor: number;
        };
      };
      const bankBytes = readFileSync(bankPath, "utf8").replace(/\r\n?/gu, "\n");
      const bankSha256 = createHash("sha256")
        .update(bankBytes, "utf8")
        .digest("hex");

      expect(manifest.version).toBe(1);
      expect(manifest.batchId).toBe(batchId);
      expect(manifest.baseCommit).toMatch(/^[0-9a-f]{40}$/u);
      expect(manifest.bankSha256).toBe(bankSha256);
      expect(manifest.projectedArtifactHashes).toEqual({
        authored: expect.stringMatching(/^[0-9a-f]{64}$/u),
        generated: expect.stringMatching(/^[0-9a-f]{64}$/u),
        evidence: expect.stringMatching(/^[0-9a-f]{64}$/u),
      });
      expect(Object.keys(manifest.reviewers).sort()).toEqual([
        "estonian",
        "factual",
        "playability",
        "release",
      ]);
      expect(
        Object.values(manifest.reviewers).every(
          (reviewer) => reviewer.trim() !== "",
        ),
      ).toBe(true);
      expect(manifest.reviewedCounts).toEqual({
        clues: 100,
        categories: 20,
        sources: 100,
      });
      expect(manifest.sourceDisposition).toEqual({
        checked: 100,
        passed: 100,
        failed: 0,
      });
      expect(Array.isArray(manifest.collisionDispositions)).toBe(true);
      expect(manifest.finalSeverityCounts).toEqual({
        critical: 0,
        important: 0,
        minor: 0,
      });
    },
  );

  it("keeps the Art & Architecture bank varied and accepts ordinary player answers", () => {
    const art = getEasyExpansionBank("05-art-architecture");
    const byId = new Map(
      art
        .flatMap(({ questions }) => questions)
        .map((candidate) => [candidate.clueId, candidate]),
    );
    const requiredAnswers: Readonly<
      Record<string, Readonly<{ en: readonly string[]; et: readonly string[] }>>
    > = {
      "004": { en: ["paint by numbers"], et: ["numbrite järgi maalimine"] },
      "006": {
        en: ["fuchsia", "fuchsia pink"],
        et: ["fuksiaroosa", "fuksia"],
      },
      "008": {
        en: ["scarlet", "scarlet red"],
        et: ["sarlakpunane", "scarlet"],
      },
      "012": {
        en: ["woodturning", "wood turning"],
        et: ["puidutreimine", "puutreimine"],
      },
      "013": {
        en: ["topiary", "topiary art"],
        et: ["topiaarkunst", "vormpügamine"],
      },
      "018": {
        en: ["Lego minifigure", "minifigure", "Lego figure", "Lego man"],
        et: ["LEGO minifiguur", "minifiguur", "LEGO figuur", "legomehike"],
      },
      "026": {
        en: ["photo album", "photograph album"],
        et: ["fotoalbum", "pildialbum"],
      },
      "027": {
        en: ["contact print", "contact sheet"],
        et: ["kontaktkoopia", "kontaktleht"],
      },
      "028": {
        en: ["photographic enlarger", "enlarger"],
        et: ["fotosuurendi", "suurendi"],
      },
      "036": { en: ["diorama"], et: ["dioraam"] },
      "040": { en: ["permanent collection"], et: ["püsikogu"] },
      "047": {
        en: ["paper plane", "paper airplane"],
        et: ["paberlennuk", "paberist lennuk"],
      },
      "081": { en: ["colored pencil"], et: ["värvipliiats"] },
      "083": { en: ["gel pen"], et: ["geelpliiats", "geelpastakas"] },
      "086": {
        en: ["cross-stitch", "cross stitch"],
        et: ["ristpiste", "ristpistes tikkimine"],
      },
      "091": { en: ["plywood"], et: ["vineer"] },
      "093": { en: ["flat glass", "plate glass"], et: ["tahvelklaas"] },
    };
    const normalizeAnswer = (value: string): string =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/gu, "")
        .toLocaleLowerCase("en")
        .replace(/^(?:a|an|the)\s+/u, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    for (const [suffix, answers] of Object.entries(requiredAnswers)) {
      const clueId = `built-in-art-architecture-easy-expansion-${suffix}`;
      const candidate = byId.get(clueId);
      expect(candidate, clueId).toBeDefined();
      for (const language of ["en", "et"] as const) {
        const accepted = new Set(
          [
            candidate!.response[language],
            ...candidate!.acceptedVariants[language],
          ].map(normalizeAnswer),
        );
        for (const answer of answers[language]) {
          expect(accepted, `${clueId}:${language}:${answer}`).toContain(
            normalizeAnswer(answer),
          );
        }
      }
    }

    const startsAsDefinition = (value: string): boolean =>
      /^(?:what|which)\b/iu.test(value);
    const questions = art.flatMap(({ questions: candidates }) => candidates);
    expect(
      questions.filter(({ clue }) => startsAsDefinition(clue.en)).length,
    ).toBeLessThanOrEqual(50);
    for (const category of art) {
      expect(
        category.questions.some(({ clue }) => !startsAsDefinition(clue.en)),
      ).toBe(true);
    }
  });

  it("keeps the Music bank varied and accepts ordinary bilingual player answers", () => {
    const music = getEasyExpansionBank("06-music");
    const byId = new Map(
      music
        .flatMap(({ questions }) => questions)
        .map((candidate) => [candidate.clueId, candidate]),
    );
    const requiredAnswers: Readonly<
      Record<string, Readonly<{ en: readonly string[]; et: readonly string[] }>>
    > = {
      "001": { en: ["string quartet"], et: ["keelpillikvartett"] },
      "011": { en: ["reggaeton", "reguetón"], et: ["reggaeton", "reguetón"] },
      "020": { en: ["Sheryl Crow"], et: ["Sheryl Crow"] },
      "024": {
        en: ["capo", "capotasto"],
        et: ["barreevõti", "kapo", "kapodaster"],
      },
      "030": { en: ["Heart and Soul"], et: ["Heart and Soul"] },
      "031": { en: ["Are You Sleeping?"], et: ["Sepapoisid"] },
      "044": {
        en: ["sousaphone", "marching tuba"],
        et: ["sousafon", "marsituuba"],
      },
      "045": {
        en: ["euphonium", "marching euphonium"],
        et: ["eufoonium", "euphonium", "marsiorkestri eufoonium"],
      },
      "046": { en: ["musical staff", "stave"], et: ["noodijoonestik"] },
      "047": { en: ["bar line", "barline"], et: ["taktijoon", "taktikriips"] },
      "048": {
        en: ["quarter note", "crotchet"],
        et: ["veerandnoot", "neljandiknoot"],
      },
      "055": { en: ["William Tell Overture"], et: ["Wilhelm Telli avamäng"] },
      "056": {
        en: ["yodeling", "yodelling"],
        et: ["joodeldamine", "joodlemine"],
      },
      "057": {
        en: ["sea shanty", "shanty"],
        et: ["meremeeste töölaul", "madruste töölaul"],
      },
      "058": { en: ["doo-wop"], et: ["doo-wop"] },
      "059": {
        en: ["barbershop music", "barbershop"],
        et: ["barbershop-muusika", "barbershop"],
      },
      "066": {
        en: ["electronic drums", "electronic drum kit"],
        et: ["elektrontrummid"],
      },
      "069": {
        en: ["digital audio workstation", "DAW"],
        et: ["digitaalne helitööjaam", "DAW"],
      },
      "084": { en: ["cakewalk"], et: ["cakewalk"] },
      "088": {
        en: ["Hindi film music", "Bollywood film music"],
        et: ["Hindi filmimuusika", "Bollywoodi filmimuusika"],
      },
      "092": { en: ["Franz Liszt", "Liszt"], et: ["Franz Liszt", "Liszt"] },
      "097": {
        en: ["The Cardigans", "Cardigans"],
        et: ["The Cardigans", "Cardigans"],
      },
    };
    const normalizeAnswer = (value: string): string =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/gu, "")
        .toLocaleLowerCase("en")
        .replace(/^(?:a|an|the)\s+/u, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    for (const [suffix, answers] of Object.entries(requiredAnswers)) {
      const clueId = `built-in-music-easy-expansion-${suffix}`;
      const candidate = byId.get(clueId);
      expect(candidate, clueId).toBeDefined();
      for (const language of ["en", "et"] as const) {
        const accepted = new Set(
          [
            candidate!.response[language],
            ...candidate!.acceptedVariants[language],
          ].map(normalizeAnswer),
        );
        for (const answer of answers[language]) {
          expect(accepted, `${clueId}:${language}:${answer}`).toContain(
            normalizeAnswer(answer),
          );
        }
      }
    }

    expect(byId.get("built-in-music-easy-expansion-027")?.source.url).toBe(
      "https://en.wikipedia.org/wiki/Chopsticks_(waltz)",
    );
    expect(
      music
        .find(({ categorySetId }) => categorySetId === "built-in-music-set-108")
        ?.questions.map(({ response }) => response.en),
    ).toEqual([
      "a jazz trio",
      "swing music",
      "ragtime",
      "walking bass",
      "cool jazz",
    ]);
    expect(
      music
        .find(({ categorySetId }) => categorySetId === "built-in-music-set-109")
        ?.questions.map(({ response }) => response.en),
    ).toEqual([
      "a bass drum",
      "a snare drum",
      "a bugle",
      "sousaphone",
      "a euphonium",
    ]);
    expect(
      music
        .find(({ categorySetId }) => categorySetId === "built-in-music-set-112")
        ?.questions.map(({ response }) => response.en),
    ).toEqual([
      "yodeling",
      "sea shanty",
      "doo-wop",
      "barbershop music",
      "the whistle register",
    ]);
    expect(
      byId.get("built-in-music-easy-expansion-046")?.acceptedVariants.et,
    ).not.toContain("noodistik");
    expect(
      byId.get("built-in-music-easy-expansion-048")?.acceptedVariants.et,
    ).not.toContain("veerandiknoot");

    const questions = music.flatMap(({ questions: candidates }) => candidates);
    const startsAsDefinition = (value: string): boolean =>
      /^(?:what|which)\b/iu.test(value);
    expect(
      questions.filter(({ clue }) => startsAsDefinition(clue.en)),
    ).toHaveLength(0);
    expect(new Set(music.map(({ name }) => name.en)).size).toBe(20);
    expect(new Set(music.map(({ name }) => name.et)).size).toBe(20);
    for (const category of music) {
      expect(
        new Set(category.questions.map(({ subjectKey }) => subjectKey)).size,
      ).toBe(5);
      expect(
        new Set(
          category.questions.map(({ response }) =>
            normalizeAnswer(response.en),
          ),
        ).size,
      ).toBe(5);
    }
  });

  it("keeps the Film & Television bank varied, playable, and on its reviewed routes", () => {
    const film = getEasyExpansionBank("07-film-television");
    const questions = film.flatMap(({ questions: candidates }) => candidates);
    const byId = new Map(
      questions.map((candidate) => [candidate.clueId, candidate]),
    );
    const bySet = new Map(
      film.map((category) => [category.categorySetId, category]),
    );
    const normalizeAnswer = (value: string): string =>
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/gu, "")
        .toLocaleLowerCase("en")
        .replace(/^(?:a|an|the)\s+/u, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    expect(film).toHaveLength(20);
    expect(questions).toHaveLength(100);
    expect(
      new Map(
        [...new Set(film.map(({ macroTopic }) => macroTopic))].map(
          (macroTopic) => [
            macroTopic,
            film.filter((category) => category.macroTopic === macroTopic)
              .length,
          ],
        ),
      ),
    ).toEqual(
      new Map([
        ["actors", 2],
        ["animation", 2],
        ["awards", 1],
        ["directors", 2],
        ["genres", 3],
        ["production-craft", 2],
        ["screen-adaptations", 2],
        ["series", 2],
        ["television-history", 2],
        ["world-cinema", 2],
      ]),
    );

    const muppets = byId.get("built-in-film-television-easy-expansion-038");
    expect(muppets?.response).toEqual({ en: "The Muppets", et: "Muppetid" });
    expect(muppets?.acceptedVariants).toEqual({ en: [], et: [] });
    expect(muppets?.factKey).toBe(
      "film-television-easy-expansion:the-muppets-2011-film:17fm7co",
    );
    expect(muppets?.subjectKey).toBe("film-television:the-muppets-2011-film");
    expect(muppets?.source).toMatchObject({
      title: "The Muppets (2011 film) — Wikipedia",
      url: "https://en.wikipedia.org/wiki/The_Muppets_(2011_film)",
    });

    const fiveNightsAtFreddys = byId.get(
      "built-in-film-television-easy-expansion-065",
    );
    expect(fiveNightsAtFreddys?.response).toEqual({
      en: "Five Nights at Freddy's",
      et: "Viis ööd Freddy baaris",
    });
    expect(fiveNightsAtFreddys?.acceptedVariants.et).toEqual([
      "Five Nights at Freddy's",
    ]);

    const expectedResponses: Readonly<Record<string, readonly string[]>> = {
      "105": [
        "Oppenheimer",
        "The Incredibles",
        "Zootopia",
        "12 Years a Slave",
        "Encanto",
      ],
      "106": [
        "Captain Marvel",
        "What Women Want",
        "Sleepless in Seattle",
        "Point Break",
        "A League of Their Own",
      ],
      "107": [
        "Clint Eastwood",
        "Angelina Jolie",
        "Ben Affleck",
        "George Clooney",
        "Robert Redford",
      ],
      "119": [
        "Top Gun",
        "Beverly Hills Cop",
        "Rain Man",
        "Who Framed Roger Rabbit",
        "Scarface",
      ],
    };
    for (const [suffix, responses] of Object.entries(expectedResponses)) {
      expect(
        bySet
          .get(`built-in-film-television-set-${suffix}`)
          ?.questions.map(({ response }) => response.en),
      ).toEqual(responses);
    }

    const oscarQuestions = bySet.get(
      "built-in-film-television-set-105",
    )!.questions;
    for (const candidate of oscarQuestions) {
      expect(candidate.clue.en).toMatch(/Oscar/iu);
      expect(candidate.clue.et).toMatch(/Oscar/iu);
      expect(candidate.explanation.en).toMatch(/Oscar/iu);
      expect(candidate.explanation.et).toMatch(/Oscar/iu);
    }

    const womenDirectors = [
      "Anna Boden",
      "Nancy Meyers",
      "Nora Ephron",
      "Kathryn Bigelow",
      "Penny Marshall",
    ];
    for (const [index, candidate] of bySet
      .get("built-in-film-television-set-106")!
      .questions.entries()) {
      expect(candidate.clue.en).toMatch(/(?:co-)?directed/iu);
      expect(candidate.clue.et).toMatch(/lavasta/iu);
      expect(`${candidate.clue.en} ${candidate.explanation.en}`).toContain(
        womenDirectors[index],
      );
    }

    for (const candidate of bySet.get("built-in-film-television-set-107")!
      .questions) {
      expect(`${candidate.clue.en} ${candidate.explanation.en}`).toMatch(
        /(?:star|actress|actor|played)/iu,
      );
      expect(`${candidate.clue.en} ${candidate.explanation.en}`).toMatch(
        /direct/iu,
      );
      expect(`${candidate.clue.et} ${candidate.explanation.et}`).toMatch(
        /(?:staar|näitle|kehast|peaosa)/iu,
      );
      expect(`${candidate.clue.et} ${candidate.explanation.et}`).toMatch(
        /lavasta/iu,
      );
    }

    const quietPlace = byId.get("built-in-film-television-easy-expansion-050");
    expect(quietPlace?.response).toEqual({
      en: "A Quiet Place",
      et: "Kena vaikne kohake",
    });
    expect(quietPlace?.tier).toBe(5);
    expect(quietPlace?.clue.en).toMatch(/family.*silence.*sound/iu);
    expect(quietPlace?.source.url).toBe(
      "https://en.wikipedia.org/wiki/A_Quiet_Place",
    );

    const rogerRabbit = byId.get("built-in-film-television-easy-expansion-094");
    expect(rogerRabbit?.tier).toBe(4);
    expect(rogerRabbit?.clue.en).toMatch(
      /Eddie Valiant.*murder.*Roger Rabbit/iu,
    );
    expect(rogerRabbit?.clue.et).toMatch(
      /Eddie Valiant.*mõrva.*Roger Rabbit/iu,
    );
    expect(rogerRabbit?.source.url).toBe(
      "https://en.wikipedia.org/wiki/Who_Framed_Roger_Rabbit",
    );

    const canonicalSources: Readonly<Record<string, string>> = {
      "013": "Paw_Patrol",
      "015": "Bluey_(TV_series)",
      "039": "Footloose",
      "052": "Credits",
      "053": "Freeze-frame_shot",
      "055": "Split_screen_effect",
      "087": "Dallas_(TV_series)",
    };
    for (const [suffix, page] of Object.entries(canonicalSources)) {
      expect(
        byId.get(`built-in-film-television-easy-expansion-${suffix}`)?.source
          .url,
      ).toBe(`https://en.wikipedia.org/wiki/${page}`);
    }

    expect(
      new Set(questions.map(({ response }) => normalizeAnswer(response.en)))
        .size,
    ).toBe(100);
    expect(
      new Set(questions.map(({ response }) => normalizeAnswer(response.et)))
        .size,
    ).toBe(100);
    expect(new Set(questions.map(({ factKey }) => factKey)).size).toBe(100);
    expect(new Set(questions.map(({ subjectKey }) => subjectKey)).size).toBe(
      100,
    );
    expect(new Set(questions.map(({ source }) => source.url)).size).toBe(100);
    expect(new Set(questions.map(({ source }) => source.title)).size).toBe(100);
    for (const candidate of questions) {
      expect(candidate.clue.en).not.toMatch(/^(?:what|which)\b/iu);
      for (const language of ["en", "et"] as const) {
        expect(candidate.clue[language].trim()).not.toBe("");
        expect(candidate.response[language].trim()).not.toBe("");
        expect(candidate.explanation[language].trim()).not.toBe("");
        const normalizedClue = normalizeAnswer(candidate.clue[language]);
        const acceptedAnswers = [
          candidate.response[language],
          ...candidate.acceptedVariants[language],
        ].map(normalizeAnswer);
        for (const acceptedAnswer of acceptedAnswers) {
          expect(
            ` ${normalizedClue} `,
            `${candidate.clueId}:${language}:${acceptedAnswer}`,
          ).not.toContain(` ${acceptedAnswer} `);
        }
      }
    }
  });

  it("combines banks deterministically by batch and category set without mutating inputs", () => {
    const history = bank("01-history", "built-in-history");
    const geography = bank("02-geography", "built-in-geography");
    const historyFirstInputId = history.categories[0]!.categorySetId;

    const corpus = combineEasyExpansionBanks([geography, history]);

    expect(Object.isFrozen(corpus)).toBe(true);
    expect(corpus.map(({ categorySetId }) => categorySetId)).toEqual([
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-history-set-${101 + index}`,
      ),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-geography-set-${101 + index}`,
      ),
    ]);
    expect(history.categories[0]!.categorySetId).toBe(historyFirstInputId);
    expect(() =>
      (corpus as EasyExpansionCategory[]).push(history.categories[0]!),
    ).toThrow();
  });

  it("rejects a registered bank that does not contain exactly twenty categories", () => {
    const history = bank("01-history", "built-in-history");

    expect(() =>
      combineEasyExpansionBanks([
        {
          ...history,
          categories: history.categories.slice(1),
        },
      ]),
    ).toThrowError(/01-history.*exactly 20 categories.*19/iu);
  });

  it("rejects duplicate batch registrations", () => {
    expect(() =>
      combineEasyExpansionBanks([
        bank("01-history", "built-in-history"),
        bank("01-history", "built-in-other-history"),
      ]),
    ).toThrowError(/duplicate easy expansion batch registration.*01-history/iu);
  });

  it("rejects duplicate category set registrations across banks", () => {
    const history = bank("01-history", "built-in-history");
    const geography = bank("02-geography", "built-in-geography");
    const duplicate = {
      ...geography.categories[0]!,
      categorySetId: history.categories[0]!.categorySetId,
    };

    expect(() =>
      combineEasyExpansionBanks([
        history,
        replaceCategory(geography, 0, duplicate),
      ]),
    ).toThrowError(
      /duplicate easy expansion category set registration.*built-in-history-set-120/iu,
    );
  });

  it("rejects duplicate clue registrations across banks", () => {
    const history = bank("01-history", "built-in-history");
    const geography = bank("02-geography", "built-in-geography");
    const geographyCategory = geography.categories[0]!;
    const duplicateClue = {
      ...geographyCategory.questions[0]!,
      clueId: history.categories[0]!.questions[0]!.clueId,
    };
    const duplicate = {
      ...geographyCategory,
      questions: [duplicateClue, ...geographyCategory.questions.slice(1)],
    };

    expect(() =>
      combineEasyExpansionBanks([
        history,
        replaceCategory(geography, 0, duplicate),
      ]),
    ).toThrowError(
      /duplicate easy expansion clue registration.*built-in-history-easy-expansion-096/iu,
    );
  });

  it("rejects a category registered under a different batch", () => {
    const history = bank("01-history", "built-in-history");
    const mismatched = {
      ...history.categories[0]!,
      batchId: "02-geography",
    };

    expect(() =>
      combineEasyExpansionBanks([replaceCategory(history, 0, mismatched)]),
    ).toThrowError(
      /category.*built-in-history-set-120.*02-geography.*01-history/iu,
    );
  });
});

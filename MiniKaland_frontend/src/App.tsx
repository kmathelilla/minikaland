
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  Clock3,
  Download,
  Info,
  Leaf,
  Palette,
  PencilLine,
  PersonStanding,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import {
  CATEGORY_LABELS,
  type Category,
  type SearchFilters,
} from './lib/activities';

import {
  evaluateActivity,
  generateAdventureSheet,
  recommendActivities,
  type DevelopmentAreaRating,
  type GeneratedActivity,
} from './lib/api';

// A négy kategória később négy külön AI skillhez kapcsolódik.
const categoryUI: { id: Category; Icon: typeof Leaf }[] = [
  { id: 'montessori', Icon: Leaf },
  { id: 'fejleszto', Icon: BrainCircuit },
  { id: 'kreativ', Icon: Palette },
  { id: 'mozgasos', Icon: PersonStanding },
];

const gallery = [
  {
    src: '/images/galeria-kucko.jpg',
    alt: 'Fényfüzérrel díszített, puha párnás mesesátor',
  },
  {
    src: '/images/galeria-alkotas.jpg',
    alt: 'Kifestett mesekastély ecsetekkel és vízfestékkel',
  },
  {
    src: '/images/galeria-raketa.jpg',
    alt: 'Kék és narancssárga játékűrrakéta és szivárvány',
  },
];

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    prompt: '',
    age: 4,
    duration: 30,
    location: 'mindegy',
    categories: [],
  });

  const [results, setResults] = useState<GeneratedActivity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'sample' | 'gemini'>('sample');
  const [developmentRatings, setDevelopmentRatings] = useState<
    Record<string, DevelopmentAreaRating[]>
  >({});
  const [evaluationLoading, setEvaluationLoading] = useState<
    Record<string, boolean>
  >({});
  const [evaluationErrors, setEvaluationErrors] = useState<
    Record<string, string>
  >({});
  const [adventureSheetLoading, setAdventureSheetLoading] = useState<
    Record<string, boolean>
  >({});
  const [adventureSheetErrors, setAdventureSheetErrors] = useState<
    Record<string, string>
  >({});

  const resultsRef = useRef<HTMLElement>(null);
  const activeActivityIdsRef = useRef<Set<string>>(new Set());
  const followupRequestsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!results) return;

    results.forEach(activity => {
      if (
        !activeActivityIdsRef.current.has(activity.id) ||
        followupRequestsRef.current.has(activity.id)
      ) {
        return;
      }

      followupRequestsRef.current.add(activity.id);

      void evaluateActivity(activity)
        .then(response => {
          if (!activeActivityIdsRef.current.has(activity.id)) return;
          setDevelopmentRatings(previous => ({
            ...previous,
            [activity.id]: response.areas,
          }));
        })
        .catch(evaluationError => {
          if (!activeActivityIdsRef.current.has(activity.id)) return;
          setEvaluationErrors(previous => ({
            ...previous,
            [activity.id]:
              evaluationError instanceof Error
                ? evaluationError.message
                : 'Az AI-becslés nem érhető el.',
          }));
        })
        .finally(() => {
          if (!activeActivityIdsRef.current.has(activity.id)) return;
          setEvaluationLoading(previous => ({
            ...previous,
            [activity.id]: false,
          }));
        });

    });
  }, [results]);

  function toggleCategory(category: Category) {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(item => item !== category)
        : [...prev.categories, category],
    }));
  }

  async function createAdventureSheet(activity: GeneratedActivity) {
    if (adventureSheetLoading[activity.id]) return;

    setAdventureSheetLoading(previous => ({
      ...previous,
      [activity.id]: true,
    }));
    setAdventureSheetErrors(previous => ({
      ...previous,
      [activity.id]: '',
    }));

    try {
      const { blob, filename } = await generateAdventureSheet(activity);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (sheetError) {
      setAdventureSheetErrors(previous => ({
        ...previous,
        [activity.id]:
          sheetError instanceof Error
            ? sheetError.message
            : 'A kalandlap készítése nem sikerült.',
      }));
    } finally {
      setAdventureSheetLoading(previous => ({
        ...previous,
        [activity.id]: false,
      }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    activeActivityIdsRef.current.clear();
    followupRequestsRef.current.clear();
    setLoading(true);
    setError('');
    setResults(null);
    setDevelopmentRatings({});
    setEvaluationLoading({});
    setEvaluationErrors({});
    setAdventureSheetLoading({});
    setAdventureSheetErrors({});

    try {
      const data = await recommendActivities(filters);

      const activityIds = new Set(data.activities.map(activity => activity.id));
      activeActivityIdsRef.current = activityIds;
      followupRequestsRef.current = new Set();
      setResults(data.activities);
      setSource(data.source);
      setEvaluationLoading(
        Object.fromEntries(data.activities.map(activity => [activity.id, true]))
      );

      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 70);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nem sikerült a játékötletek generálása.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="siteShell">
      <header className="hero" aria-label="MiniKaland nyitókép">
        <h1 className="heroBrand">
          <Crown aria-hidden="true" size={30} strokeWidth={1.7} />
          MiniKaland
        </h1>

        <img
          className="heroImage"
          src="/images/hero.jpg"
          alt="Két gyermek mesekönyvet néz egy puha kuckóban"
        />
      </header>

      <main className="content">
        <section className="intro" aria-labelledby="headline">
          <div className="headlineRow">
            <span className="hairline" aria-hidden="true" />
            <h2 id="headline">Mit játsszunk ma?</h2>
            <span className="hairline" aria-hidden="true" />
          </div>

          <p>Játékötletek, amikből élmény lesz.</p>
        </section>

        <form
          className="searchPanel"
          onSubmit={submit}
          aria-label="Játékötlet-kereső"
        >
          <div className="inputGrid">
            <div className="field">
              <label htmlFor="child-age">
                <CalendarDays size={21} strokeWidth={1.8} />
                Életkor
              </label>

              <div className="selectFrame">
                <select
                  id="child-age"
                  value={filters.age}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      age: Number(e.target.value),
                    }))
                  }
                >
                  {Array.from({ length: 10 }, (_, i) => i + 3).map(age => (
                    <option key={age} value={age}>
                      {age} év
                    </option>
                  ))}
                </select>

                <ChevronDown aria-hidden="true" size={19} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="available-time">
                <Clock3 size={21} strokeWidth={1.8} />
                Rendelkezésre álló idő
              </label>

              <div className="selectFrame">
                <select
                  id="available-time"
                  value={filters.duration}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                >
                  {[15, 30, 45, 60].map(minutes => (
                    <option key={minutes} value={minutes}>
                      {minutes} perc
                    </option>
                  ))}
                </select>

                <ChevronDown aria-hidden="true" size={19} />
              </div>
            </div>

            <div className="field fieldPrompt">
              <label htmlFor="activity-prompt">
                <PencilLine size={21} strokeWidth={1.8} />
                Mire vágysz ma?
              </label>

              <input
                id="activity-prompt"
                type="text"
                maxLength={280}
                placeholder="Pl. mese, alkotás, mozgás, otthoni játék…"
                value={filters.prompt}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    prompt: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <fieldset className="categoryRow">
            <legend className="visuallyHidden">
              Játéktípusok – több is választható
            </legend>

            {categoryUI.map(({ id, Icon }) => {
              const selected = filters.categories.includes(id);

              return (
                <button
                  key={id}
                  className={`categoryChip ${selected ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(id)}
                >
                  <span
                    className={`checkBox ${selected ? 'checked' : ''}`}
                    aria-hidden="true"
                  >
                    {selected && (
                      <Check size={13} strokeWidth={3} />
                    )}
                  </span>

                  <Icon
                    size={23}
                    strokeWidth={1.6}
                    className="chipIcon"
                    aria-hidden="true"
                  />

                  <span>{CATEGORY_LABELS[id]}</span>
                </button>
              );
            })}
          </fieldset>

          <div className="buttonRow">
            <button
              type="submit"
              className="searchButton"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <Search size={23} strokeWidth={2} />
              )}

              <span>
                {loading
                  ? 'Ötletek generálása…'
                  : 'Játékötletek keresése'}
              </span>

              {!loading && <ChevronRight size={21} />}
            </button>
          </div>

          {error && (
            <p role="alert" className="errorMessage">
              {error}
            </p>
          )}
        </form>

        {results !== null && (
          <section
            className="results"
            aria-labelledby="resultsTitle"
            ref={resultsRef}
          >
            <div className="resultsHeading">
              <div>
                <p className="eyebrow">
                  <Sparkles size={16} />
                  Személyre szabott inspiráció
                </p>

                <h3 id="resultsTitle">
                  Ezt próbáljátok ki!
                </h3>
              </div>

              <button
                className="closeResults"
                type="button"
                onClick={() => {
                  activeActivityIdsRef.current.clear();
                  followupRequestsRef.current.clear();
                  setResults(null);
                }}
                aria-label="Találatok bezárása"
              >
                <X size={21} />
              </button>
            </div>

            <p className="demoNotice">
              <Info size={17} />
              {source === 'sample'
                ? 'Demó: a javaslatok helyi mintaadatokból érkeznek.'
                : 'A játékötleteket a Gemini AI generálta.'}
            </p>

            {results.length === 0 ? (
              <div className="emptyState">
                Nem találtam megfelelő játékötletet.
                Próbálj másik témát vagy kategóriát.
              </div>
            ) : (
              <div className="resultGrid">
                {results.map(activity => (
                  <article
                    key={activity.id}
                    className="resultCard"
                  >
                    <div className="resultImageArea">
                      <img
                        src={activity.image}
                        alt={`${activity.name} illusztrációja`}
                      />
                    </div>

                    <div className="resultBody">
                      <div className="resultTitle">
                        <div>
                          <span className="resultCategory">
                            {CATEGORY_LABELS[activity.category]}
                          </span>
                          <h4>{activity.name}</h4>
                        </div>

                        <div className="metaRow">
                          <Clock3 size={15} />
                          {activity.duration} perc
                          <span className="metaDot">·</span>
                          {activity.ageMin}–{activity.ageMax} év
                        </div>
                      </div>

                      {activity.subtitle && (
                        <p className="resultDescription">
                          {activity.subtitle}
                        </p>
                      )}

                      <div className="activityColumns">
                        <section className="activityColumn materialsColumn">
                          <h5>Szükséges eszközök</h5>
                          <ul>
                            {activity.materials.map((material, index) => (
                              <li key={`${index}-${material}`}>
                                {material}
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section className="activityColumn stepsColumn">
                          <h5>Hogyan játsszátok?</h5>
                          <ol>
                            {activity.steps.map((step, index) => (
                              <li key={`${index}-${step}`}>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </section>
                      </div>

                      <div className="developmentRatings">
                        <p className="ratingDisclaimer">
                          AI-becslés · nem validált fejlesztési értékelés
                        </p>
                        {evaluationLoading[activity.id] && (
                          <p className="ratingStatus" role="status">
                            Az AI-becslés készül…
                          </p>
                        )}
                        {evaluationErrors[activity.id] && (
                          <p className="ratingStatus" role="status">
                            Az AI-becslés nem érhető el.{' '}
                            {evaluationErrors[activity.id]}
                          </p>
                        )}
                        {developmentRatings[activity.id] && (
                          <ul className="ratingList">
                            {developmentRatings[activity.id].map(rating => (
                              <li key={rating.name}>
                                <span
                                  className="ratingStars"
                                  aria-label={`${rating.stars} csillag a 3-ból`}
                                >
                                  {'★'.repeat(rating.stars)}
                                  {'☆'.repeat(3 - rating.stars)}
                                </span>
                                <span>{rating.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <p className="safety">
                        <Info size={15} />
                        {activity.safety}
                      </p>

                      <div className="adventureSheetTools">
                        <button
                          className="adventureSheetButton"
                          type="button"
                          disabled={adventureSheetLoading[activity.id]}
                          onClick={() => void createAdventureSheet(activity)}
                        >
                          <Download size={16} aria-hidden="true" />
                          {adventureSheetLoading[activity.id]
                            ? 'Kalandlap készül…'
                            : 'Kalandlap készítése'}
                        </button>
                        {adventureSheetErrors[activity.id] && (
                          <p className="adventureSheetError" role="alert">
                            {adventureSheetErrors[activity.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section
          className="gallery"
          aria-label="Inspiráló játékos pillanatok"
        >
          {gallery.map((item, i) => (
            <div
              className="galleryItem"
              key={item.src}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
              />
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        MiniKaland
        <span>·</span>
        Egy kis ötlet, egy nagy kaland
        <span>·</span>
        AI-alapú játékötlet-generátor
      </footer>
    </div>
  );
}

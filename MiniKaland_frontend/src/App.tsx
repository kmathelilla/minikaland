import { useRef, useState, type FormEvent } from 'react';
import {
  BrainCircuit, CalendarDays, Check, ChevronDown, ChevronRight, Crown,
  Clock3, Info, Leaf, Palette, PencilLine, PersonStanding,
  Search, Sparkles, X,
} from 'lucide-react';
import { CATEGORY_LABELS, type Activity, type Category, type SearchFilters } from './lib/activities';
import { recommendActivities } from './lib/api';

const categoryUI = [
  { id: 'montessori' as const, Icon: Leaf },
  { id: 'fejleszto' as const, Icon: BrainCircuit },
  { id: 'kreativ' as const, Icon: Palette },
  { id: 'mozgasos' as const, Icon: PersonStanding },
];

const gallery = [
  { src: '/images/galeria-kucko.jpg', alt: 'Fényfüzérrel díszített, puha párnás mesesátor' },
  { src: '/images/galeria-alkotas.jpg', alt: 'Kifestett mesekastély ecsetekkel és vízfestékkel' },
  { src: '/images/galeria-raketa.jpg', alt: 'Kék és narancssárga játékűrrakéta és szivárvány' },
];

const resultImages: Record<Category, string> = {
  montessori: '/images/galeria-kucko.jpg',
  fejleszto: '/images/galeria-raketa.jpg',
  kreativ: '/images/galeria-alkotas.jpg',
  mozgasos: '/images/galeria-raketa.jpg',
};

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    prompt: '', age: 4, duration: 30, location: 'mindegy', categories: [],
  });
  const [results, setResults] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'sample' | 'gemini'>('sample');
  const resultsRef = useRef<HTMLElement>(null);

  function toggleCategory(category: Category) {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(item => item !== category)
        : [...prev.categories, category],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await recommendActivities(filters);
      setResults(data.activities);
      setSource(data.source);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 70);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nem sikerült a keresés.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="siteShell">
      <header className="hero" aria-label="MiniKaland nyitókép">
        <h1 className="heroBrand"><Crown aria-hidden="true" size={30} strokeWidth={1.7} /> MiniKaland</h1>
        <img
          className="heroImage"
          src="/images/hero.jpg"
          alt="Két szőke, kék szemű gyermek egy mesekönyvet néz egy puha kuckóban"
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

        <form className="searchPanel" onSubmit={submit} aria-label="Játékötlet-kereső">
          <div className="inputGrid">
            <div className="field">
              <label htmlFor="child-age"><CalendarDays size={21} strokeWidth={1.8} /> Életkor</label>
              <div className="selectFrame">
                <select
                  id="child-age"
                  value={filters.age}
                  onChange={e => setFilters(prev => ({ ...prev, age: Number(e.target.value) }))}
                >
                  {Array.from({ length: 7 }, (_, i) => i + 2).map(age =>
                    <option key={age} value={age}>{age} év</option>
                  )}
                </select>
                <ChevronDown aria-hidden="true" size={19} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="available-time"><Clock3 size={21} strokeWidth={1.8} /> Rendelkezésre álló idő</label>
              <div className="selectFrame">
                <select
                  id="available-time"
                  value={filters.duration}
                  onChange={e => setFilters(prev => ({ ...prev, duration: Number(e.target.value) }))}
                >
                  {[15, 30, 45, 60].map(minutes =>
                    <option key={minutes} value={minutes}>{minutes} perc</option>
                  )}
                </select>
                <ChevronDown aria-hidden="true" size={19} />
              </div>
            </div>

            <div className="field fieldPrompt">
              <label htmlFor="activity-prompt"><PencilLine size={21} strokeWidth={1.8} /> Mire vágysz ma?</label>
              <input
                id="activity-prompt"
                type="text"
                maxLength={280}
                placeholder="Pl. mese, alkotás, mozgás, otthoni játék…"
                value={filters.prompt}
                onChange={e => setFilters(prev => ({ ...prev, prompt: e.target.value }))}
              />
            </div>
          </div>

          <fieldset className="categoryRow">
            <legend className="visuallyHidden">Játéktípusok – több is választható</legend>
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
                  <span className={`checkBox ${selected ? 'checked' : ''}`} aria-hidden="true">
                    {selected && <Check size={13} strokeWidth={3} />}
                  </span>
                  <Icon size={23} strokeWidth={1.6} className="chipIcon" aria-hidden="true" />
                  <span>{CATEGORY_LABELS[id]}</span>
                </button>
              );
            })}
          </fieldset>

          <div className="buttonRow">
            <button type="submit" className="searchButton" disabled={loading}>
              {loading ? <span className="spinner" aria-hidden="true" /> : <Search size={23} strokeWidth={2} />}
              <span>{loading ? 'Ötletek keresése…' : 'Játékötletek keresése'}</span>
              {!loading && <ChevronRight size={21} />}
            </button>
          </div>
          {error && <p role="alert" className="errorMessage">{error}</p>}
        </form>

        <section className="gallery" aria-label="Inspiráló játékos pillanatok">
          {gallery.map((item, i) => (
            <div className="galleryItem" key={item.src} style={{ animationDelay: `${i * 100}ms` }}>
              <img src={item.src} alt={item.alt} loading="lazy" />
            </div>
          ))}
        </section>

        {results !== null && (
          <section className="results" aria-labelledby="resultsTitle" ref={resultsRef}>
            <div className="resultsHeading">
              <div>
                <p className="eyebrow"><Sparkles size={16} /> Személyre szabott inspiráció</p>
                <h3 id="resultsTitle">Ezt próbáljátok ki!</h3>
              </div>
              <button className="closeResults" type="button" onClick={() => setResults(null)} aria-label="Találatok bezárása"><X size={21} /></button>
            </div>
            <p className="demoNotice"><Info size={17} /> {source === 'sample'
              ? 'Demó: a javaslatok egy helyi mintaadatbázisból érkeznek. A Gemini AI bekötése a következő fejlesztési lépés.'
              : 'A javaslatokat az AI szolgáltatás állította össze.'}</p>
            {results.length === 0 ? (
              <div className="emptyState">Nem találtam pontosan illő játékot ezekkel a szűrőkkel. Próbálj több időt megadni vagy egy kategóriát kikapcsolni.</div>
            ) : (
              <div className="resultGrid">
                {results.map(activity => (
                  <article key={activity.id} className="resultCard">
                    <img src={resultImages[activity.category]} alt="Játékos illusztráció" />
                    <div className="resultBody">
                      <span className="resultCategory">{CATEGORY_LABELS[activity.category]}</span>
                      <h4>{activity.name}</h4>
                      <p>{activity.description}</p>
                      <div className="metaRow"><Clock3 size={16} /> {activity.duration} perc <span className="metaDot">·</span> {activity.ageMin}–{activity.ageMax} év</div>
                      <p className="materials"><strong>Eszközök:</strong> {activity.materials.join(', ')}</p>
                      <details>
                        <summary>Hogyan játsszátok? <ChevronRight size={17} /></summary>
                        <ol>{activity.steps.map(step => <li key={step}>{step}</li>)}</ol>
                        <p className="safety"><Info size={15} /> {activity.safety}</p>
                      </details>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="footer">MiniKaland <span>·</span> Egy kis ötlet, egy nagy kaland <span>·</span> Frontend demó</footer>
    </div>
  );
}

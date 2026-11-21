export type Category = 'montessori' | 'fejleszto' | 'kreativ' | 'mozgasos';
export type Location = 'bent' | 'kint' | 'mindegy';
export type Activity = {
  id: string;
  name: string;
  category: Category;
  duration: number;
  ageMin: number;
  ageMax: number;
  location: Exclude<Location,'mindegy'>;
  materials: string[];
  description: string;
  steps: string[];
  safety: string;
  keywords: string[];
  image: string;
  accent: string;
};

export const CATEGORY_LABELS: Record<Category,string> = {
  montessori: 'Montessori',
  fejleszto: 'Készségfejlesztő',
  kreativ: 'Kreatív',
  mozgasos: 'Mozgásos',
};

export const ACTIVITIES: Activity[] = [
  {id:'01',name:'Színmentő küldetés',category:'montessori',duration:15,ageMin:3,ageMax:7,location:'bent',materials:['színes tárgyak','tálkák','gyermekbiztos csipesz'],description:'Válogassatok színeket egy vidám kis mentőakcióban.',steps:['Készítsetek ki három különböző színű tálkát.','Szórjatok színes tárgyakat egy közös tálba.','A gyermek csipesszel válogassa szét a színeket.','Találjatok ki új színszabályokat!'],safety:'3 éves kor alatt apró tárgyak helyett nagyobb játékokat használjatok.',keywords:['szin','csipesz','tal','pompon','figyelem'],image:'/images/activity-1.svg',accent:'#efb8aa'},
  {id:'02',name:'Esőfelhő műhely',category:'kreativ',duration:25,ageMin:3,ageMax:8,location:'bent',materials:['papír','színes papír','ragasztó'],description:'Készítsetek vidám felhőket és színes esőcseppeket.',steps:['Rajzoljatok vagy vágjatok ki egy felhőt.','Készítsetek különböző színű esőcseppeket.','Ragasszátok őket egy nagy papírra.','Meséljetek történetet a kész képről!'],safety:'Olló és ragasztó használatakor legyen felnőtt felügyelet.',keywords:['eso','ragaszto','papir','rajz','idojaras'],image:'/images/activity-2.svg',accent:'#b5c7eb'},
  {id:'03',name:'Párnaszigetek',category:'mozgasos',duration:20,ageMin:2,ageMax:8,location:'bent',materials:['párnák','takaró','szabad padlófelület'],description:'Egy kis akadálypálya, nagy nevetésekkel.',steps:['Rakjatok párnákat biztonságos távolságra egymástól.','Jelöljetek ki induló- és célpontot.','Lépjetek át egyik szigetről a másikra.','Találjatok ki új mozgásokat a pályán!'],safety:'Ne építsetek magas akadályokat; csúszásmentes felületen játsszatok.',keywords:['parna','mozgas','ugral','szoba','akadalypalya'],image:'/images/activity-3.svg',accent:'#eacc89'},
  {id:'04',name:'Titkos hangvadászat',category:'fejleszto',duration:15,ageMin:3,ageMax:8,location:'bent',materials:['kanál','papír','doboz'],description:'Találjátok ki, melyik tárgy milyen hangot ad!',steps:['Tegyetek három biztonságos tárgyat az asztalra.','A gyermek hunyja be a szemét.','Szólaltass meg egy tárgyat.','Találja ki, melyik lehetett!'],safety:'Ne használjatok éles, törékeny vagy túl hangos tárgyakat.',keywords:['hang','zene','doboz','figyelem'],image:'/images/activity-4.svg',accent:'#cabce7'},
  {id:'05',name:'Papírváros építése',category:'kreativ',duration:30,ageMin:4,ageMax:8,location:'bent',materials:['papír','filctoll','ragasztó'],description:'Építsetek saját kis várost színes papírból.',steps:['Rajzoljatok különböző házakat.','Vágjátok ki őket közösen.','Ragasszátok fel egy nagyobb lapra.','Találjatok ki utcaneveket és lakókat!'],safety:'Ollóval csak életkornak megfelelően, felügyelettel dolgozzatok.',keywords:['varos','epites','papir','rajz','ragaszto'],image:'/images/activity-5.svg',accent:'#f0b6b6'},
  {id:'06',name:'Kerti kincsvadászat',category:'mozgasos',duration:30,ageMin:3,ageMax:8,location:'kint',materials:['kis kosár','papír'],description:'Keressetek természetes formákat és színeket odakint.',steps:['Írjatok vagy rajzoljatok keresnivalókat.','Induljatok el a kertbe vagy egy parkba.','Keressetek leveleket, köveket és érdekes formákat.','Nézzétek át együtt a gyűjteményt!'],safety:'Ne szedjetek ismeretlen növényt vagy gombát; figyeljetek a környezetre.',keywords:['kert','seta','kint','termeszet','level'],image:'/images/activity-6.svg',accent:'#afcfa8'},
  {id:'07',name:'Tornyok és egyensúly',category:'montessori',duration:20,ageMin:2,ageMax:6,location:'bent',materials:['nagy építőkockák'],description:'Építsetek magas, majd stabilabb tornyokat.',steps:['Tegyétek a kockákat egy tálcára.','Próbáljatok különböző tornyokat építeni.','Figyeljétek meg, melyik áll stabilan.','Próbáljátok újra más sorrendben!'],safety:'Csak nagy, nem lenyelhető kockákat használjatok.',keywords:['lego','kocka','torony','epites'],image:'/images/activity-1.svg',accent:'#efb8aa'},
  {id:'08',name:'Mi változott?',category:'fejleszto',duration:10,ageMin:3,ageMax:8,location:'bent',materials:['5–6 hétköznapi tárgy'],description:'Egy pici memóriajáték, amit bárhol játszhattok.',steps:['Tegyetek ki néhány tárgyat az asztalra.','Figyeljétek meg őket fél percig.','Takard le a tárgyakat, majd vegyél el egyet.','Találja ki a gyermek, mi hiányzik!'],safety:'A tárgyak legyenek életkornak megfelelőek és biztonságosak.',keywords:['memoria','figyelem','targy'],image:'/images/activity-4.svg',accent:'#cabce7'},
  {id:'09',name:'Színes útvonal',category:'mozgasos',duration:15,ageMin:2,ageMax:8,location:'bent',materials:['festőszalag','szabad padló'],description:'Kövesd a színes vonalat, akár egy igazi felfedező!',steps:['Ragasszatok egy egyszerű útvonalat a padlóra.','Menjetek végig rajta lassan.','Próbáljátok meg hátrafelé vagy lábujjhegyen.','Találjatok ki új szabályokat!'],safety:'Csak olyan szalagot használjatok, amely nem hagy nyomot és nem csúszik.',keywords:['szalag','mozgas','ut','egyensuly'],image:'/images/activity-3.svg',accent:'#eacc89'},
  {id:'10',name:'Természetes minták',category:'montessori',duration:20,ageMin:3,ageMax:8,location:'kint',materials:['levelek','kövek','kis tálca'],description:'Rendezzetek gyönyörű mintázatokat kerti kincsekből.',steps:['Keressetek néhány biztonságos természetes tárgyat.','Válogassátok őket méret vagy szín szerint.','Készítsetek belőlük ismétlődő mintát.','Fotózzátok le az alkotást!'],safety:'Ismeretlen növényeket és gombákat ne használjatok.',keywords:['termeszet','level','kert','minta'],image:'/images/activity-6.svg',accent:'#afcfa8'},
  {id:'11',name:'Árnyékfigurák',category:'kreativ',duration:15,ageMin:4,ageMax:8,location:'bent',materials:['lámpa','papír'],description:'Rajzoljatok és játszatok egyszerű árnyékformákkal.',steps:['Világítsatok egy falra a lámpával.','Próbáljatok kézzel árnyékokat formázni.','Rajzoljatok le egy-egy érdekes alakot.','Találjatok ki rövid történetet!'],safety:'A lámpát ne irányítsátok szembe, és ne használjatok forró fényforrást.',keywords:['arnyek','lampa','mese'],image:'/images/activity-5.svg',accent:'#f0b6b6'},
  {id:'12',name:'Lépések ritmusra',category:'mozgasos',duration:15,ageMin:3,ageMax:8,location:'bent',materials:['zenelejátszó'],description:'Kitalált mozdulatokkal táncoljatok a kedvenc zenére.',steps:['Válasszatok nyugodt zenét.','Találjatok ki három egyszerű mozdulatot.','Váltogassátok őket a ritmusra.','A gyermek is lehessen a karmester!'],safety:'Legyen elég hely és csúszásmentes talaj.',keywords:['zene','tanc','ritmus','mozgas'],image:'/images/activity-3.svg',accent:'#eacc89'},
  {id:'13',name:'Formaexpedíció',category:'fejleszto',duration:20,ageMin:3,ageMax:8,location:'bent',materials:['papír','ceruza'],description:'Keressetek köröket, háromszögeket és négyszögeket otthon!',steps:['Rajzoljatok három különböző formát.','Keressetek ilyen alakú tárgyakat a szobában.','Számoljátok meg, mennyit találtatok.','Készítsetek rajzos formakincstárat!'],safety:'Ne mozgassatok nehéz vagy törékeny tárgyakat.',keywords:['forma','szoba','rajz','figyelem'],image:'/images/activity-4.svg',accent:'#cabce7'},
  {id:'14',name:'Mini konyhalabor',category:'montessori',duration:30,ageMin:4,ageMax:8,location:'bent',materials:['mérőpohár','víz','tálca'],description:'Öntögetés, mérés és rengeteg felfedezés.',steps:['Tegyétek a mérőpoharakat egy tálcára.','Töltsetek kevés vizet az egyikbe.','Próbáljatok különböző mennyiségeket átönteni.','Figyeljétek meg, mit jelent a tele és a félig tele!'],safety:'Csak hideg vizet használjatok, végig felnőtt felügyelettel.',keywords:['viz','meres','onto','konyha'],image:'/images/activity-1.svg',accent:'#efb8aa'},
  {id:'15',name:'Szabadban színvadászat',category:'fejleszto',duration:20,ageMin:3,ageMax:8,location:'kint',materials:['papír','ceruza'],description:'Keressetek a világban öt különböző árnyalatot.',steps:['Rajzoljatok öt színes négyzetet.','Sétáljatok egyet a környéken.','Keressetek mindegyik színhez példát.','Beszéljétek meg, melyiket volt nehéz megtalálni!'],safety:'Közlekedésnél végig a gyermek mellett maradjon felnőtt.',keywords:['seta','szin','kint','termeszet'],image:'/images/activity-6.svg',accent:'#afcfa8'},
  {id:'16',name:'Kedvenc állatom',category:'kreativ',duration:30,ageMin:3,ageMax:8,location:'bent',materials:['papír','ceruza','színes ceruza'],description:'Rajzoljátok meg, milyen lenne egy teljesen új állat!',steps:['Találjatok ki egy különleges állatot.','Rajzoljátok le a testét és a színeit.','Adjatok neki nevet.','Meséljétek el, hol él és mit szeret csinálni!'],safety:'Kisebb gyermekekkel életkornak megfelelő rajzeszközt használjatok.',keywords:['rajz','allat','mese','papir'],image:'/images/activity-2.svg',accent:'#b5c7eb'},
 ];

export type SearchFilters = {
  prompt: string;
  age: number;
  duration: number;
  location: Location;
  categories: Category[];
};

const normalize = (value: string) => value.toLocaleLowerCase('hu').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const tokenize = (value: string) => normalize(value).split(/[^a-z0-9]+/).filter(v=>v.length>2);

export function findActivities(filters:SearchFilters): Activity[] {
  const words=tokenize(filters.prompt);
  const pool = ACTIVITIES.filter(a=>
    a.ageMin<=filters.age && a.ageMax>=filters.age &&
    a.duration<=filters.duration &&
    (filters.location==='mindegy'||a.location===filters.location) &&
    (filters.categories.length===0||filters.categories.includes(a.category))
  );
  const scored=pool.map(activity=>{
    const haystack=tokenize([activity.name,activity.description,...activity.materials,...activity.keywords].join(' '));
    const matches=words.filter(w=>haystack.some(h=>h.startsWith(w)||w.startsWith(h))).length;
    const relevancy=matches*15 + (activity.duration<=filters.duration ? 3:0);
    return {activity,score:relevancy};
  });
  return scored.sort((a,b)=>b.score-a.score||a.activity.id.localeCompare(b.activity.id)).slice(0,3).map(s=>s.activity);
}

# MiniKaland – React frontend

A jóváhagyott, világoskék/fehér, modern MiniKaland látványterv React + TypeScript + Vite megvalósítása.

## Indítás VS Code-ban

1. Telepítsd a Node.js LTS verzióját (ha nincs még).
2. Nyisd meg a mappát VS Code-ban.
3. Nyiss terminált (Terminal → New Terminal).
4. Futtasd:

```bash
npm install
npm run dev
```

5. Nyisd meg a terminálban kapott helyi címet (alapesetben `http://localhost:5173`).

## Mit tud már?

- Reszponzív, egylapos dizájn; eredeti jóváhagyott látványtervből kivágott saját illusztrációkkal.
- Életkor, időkeret, szabad szavas szűrő és négy pipálható kategória.
- Működő **demó**: 16 kurált mintaötletből az életkorhoz/időhöz/kategóriákhoz illeszkedő legjobb 3-at jeleníti meg.
- A részletek kinyithatók: eszközlista, lépések, felügyeleti figyelmeztetés.
- A `src/lib/api.ts` később közvetlenül a Python FastAPI + Gemini backendhez illeszthető.

## Fontos

**Gemini API még nincs bekötve.** A keresés jelenleg nem generatív, helyi mintaadatokat használ. A `VITE_API_BASE_URL`-t csak akkor töltsd ki, ha már fut a backend.

A Gemini kulcsot **csak a Python backend `.env` fájlja** tartalmazhatja; React/Vite `VITE_` változóba soha ne írd!

## Backend-szerződés a következő lépéshez

`POST /api/recommend`, request: `{prompt:string, age:number, duration:number, location:"mindegy", categories:Category[]}`.

Response: `{activities:Activity[], source:"gemini"}`. A típusok a `src/lib/activities.ts` és `src/lib/api.ts` fájlokban vannak.

# Receptvalvet

En familjesajt för att spara och dela recept. Byggd med React + Vite och hostad på [receptvalvet.se](https://receptvalvet.se).

---

## Lägga till ett recept

1. Skapa en ny fil i mappen `recipes/` med ett beskrivande filnamn på engelska, t.ex. `chocolate-cake.md`
2. Lägg till en bild i `public/images/recipes/` (valfritt)
3. Pusha till `main` — sajten uppdateras automatiskt

### Mall

```markdown
---
title: Receptets namn
meal: Middag
type: Gryta
servings: 4
prep_time: 30 min
author: Ditt namn
description: En kort beskrivning som syns på kortet.
image: filnamn.jpg
source: https://länk-till-originalet.se
tags: [kyckling, tomat]
---

## Ingredienser

- 500 g kyckling
- 2 vitlöksklyftor
- ...

## Tillagning

1. Gör det ena...
2. Sedan det andra...
```

### Fält

| Fält | Beskrivning | Obligatoriskt |
|---|---|---|
| `title` | Receptets namn | Ja |
| `meal` | `Frukost` · `Lunch` · `Middag` · `Efterrätt` · `Tillbehör` · `Snack` | Nej |
| `type` | `Gryta` · `Soppa` · `Sallad` · `Tårta` · `Bakverk` · `Sås` · `Gröt` · `Wrap` · `Dryck` | Nej |
| `servings` | Antal portioner (siffra) | Ja |
| `prep_time` | T.ex. `30 min` eller `1 h 15 min` | Ja |
| `author` | Vem som bidragit med receptet | Nej |
| `description` | Kort text som visas på receptkortet | Nej |
| `image` | Filnamn på bilden i `public/images/recipes/` | Nej |
| `source` | Länk till källan om receptet är hämtat utifrån | Nej |
| `tags` | Lista med ingredienser eller nyckelord, t.ex. `[kyckling, vitlök]` | Nej |

---

## Lokalt

```bash
pnpm install      # installera beroenden
pnpm dev          # starta på localhost:5173
pnpm build        # bygg för produktion
```

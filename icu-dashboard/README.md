# ICU Infectious Dashboard MVP

Un radar infettivologico dinamico per le terapie intensive. Ottimizzato per rapida consultazione, densità informativa e stewardship antibiotica.

## Requisiti

- Node.js 18+
- Docker (opzionale, ma consigliato per il database locale)

## Installazione e Avvio Rapido

1. Avvia il database PostgreSQL locale (se hai Docker installato):
   ```bash
   docker-compose up -d
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le variabili d'ambiente (copia il template):
   ```bash
   cp .env.example .env
   ```
4. Esegui le migrazioni e il seed del database:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
5. Avvia l'applicazione in ambiente di sviluppo:
   ```bash
   npm run dev
   ```

A questo punto, visita `http://localhost:3000` nel tuo browser. Vedrai la dashboard popolata con i 5 casi clinici realistici!

## Stack
- Next.js (App Router)
- PostgreSQL
- Prisma ORM
- Lucide React (Icone)
- Vanilla CSS (ottimizzato per densità e per stampa A4 - Print Stylesheet)

# Kussens PIM

Product Information Management (PIM) systeem voor Kussens, gebouwd met Payload CMS.

## Overzicht

Dit is een Payload CMS project voor het beheren van productinformatie voor kussens, inclusief:
- **Stoffen & Merken**: Stoffen en hun merken
- **Afwerkingen**: Afwerkingen met prijsregels
- **Vullingen**: Verschillende vullingen voor kussens
- **Producten**: Producten met ondersteunde vormen
- **Vormen**: Verschillende vormen die producten kunnen hebben

## Tech Stack

- **Payload CMS 3.74.0**: Headless CMS
- **Next.js 15.4.11**: React framework
- **PostgreSQL**: Database (via @payloadcms/db-postgres)
- **MinIO/S3**: Media storage (via @payloadcms/storage-s3)
- **TypeScript**: Type safety

## Setup

### Vereisten

- Node.js 18+
- PostgreSQL database
- MinIO instance (of S3-compatible storage)

### Installatie

1. Clone de repository:
```bash
git clone <repository-url>
cd kussens-pim
```

2. Installeer dependencies:
```bash
npm install
```

3. Kopieer `.env.example` naar `.env` en vul de variabelen in:
```bash
cp .env.example .env
```

Vereiste environment variabelen:
- `DATABASE_URL`: PostgreSQL connection string
- `PAYLOAD_SECRET`: Secret key voor Payload
- `MINIO_ENDPOINT`: MinIO endpoint URL
- `MINIO_PUBLIC_ENDPOINT`: Publieke MinIO endpoint URL
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key
- `MINIO_BUCKET`: MinIO bucket naam

4. Start de development server:
```bash
npm run dev
```

5. Open `http://localhost:3000/admin` en maak je eerste admin gebruiker aan.

## Collecties

### Stoffen
- **Merken**: Merken van stoffen
- **Stoffen**: Stoffen met relatie naar merken

### Afwerkingen
- **Afwerkingen**: Verschillende afwerkingen
- **Afwerking Regels**: Prijsregels per afwerking

### Vullingen
- **Vullingen**: Verschillende vullingen voor kussens

### Producten
- **Producten**: Producten met ondersteunde vormen
- **Vormen**: Verschillende vormen (rechthoekig, rond, etc.)

## Import Scripts

Het project bevat verschillende import scripts voor het importeren van data:

### Merken importeren
```bash
npm run import:brands
```

### Stoffen importeren
```bash
npm run import:fabrics
```

### Afwerkingen importeren
```bash
npm run import:finishes
```

### Vullingen importeren
```bash
npm run import:vullingen
```

### Vormen importeren
```bash
npm run import:vormen
```

### Producten importeren
```bash
npm run import:products
```

**Let op**: Importeer eerst Vormen voordat je Producten importeert, zodat de vorm relaties correct worden gelegd.

## Database Migraties

Als je problemen hebt met de database schema, kun je de products tabel resetten:

```bash
npm run fix:products-db
```

## Development

### Type Generation
Na het aanpassen van collecties, genereer de types:
```bash
npm run generate:types
```

### Import Map Generation
Na het toevoegen van custom components:
```bash
npm run generate:importmap
```

## Project Structuur

```
src/
├── app/              # Next.js app routes
├── collections/      # Payload collecties
├── payload.config.ts # Payload configuratie
└── payload-types.ts  # Generated types

scripts/
├── import-*.ts       # Import scripts
└── clear-*.ts        # Clear scripts
```

## License

MIT

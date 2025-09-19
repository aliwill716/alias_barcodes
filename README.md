# ShipHero Barcode Matrix

A standalone Next.js application for creating product case barcodes in ShipHero by uploading CSV files.

## Features

- 🔐 ShipHero OAuth authentication with refresh token support
- 🏢 3PL support with account ID management
- 📊 CSV file upload with automatic header mapping
- ⚡ Batch processing for efficient API calls
- 🎨 Retro/futuristic UI design
- 🚀 Vercel deployment ready

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

## Usage

1. **Authentication:**
   - Enter your ShipHero refresh token
   - Check "I am a 3PL" if you're a 3PL and enter the client account ID
   - Click "Connect to ShipHero"

2. **CSV Upload:**
   - Upload a CSV file with columns for SKU, case barcode, and case quantity
   - Map the CSV headers to the required fields
   - Click "Process Products" to update ShipHero

## CSV Format

Your CSV should contain these columns (headers can be named anything):
- SKU (product identifier)
- Case Barcode (barcode for the case)
- Case Quantity (number of units in the case)

Example:
```csv
SKU,Case_Barcode,Case_Quantity
PROD-001,123456789012,12
PROD-002,123456789013,24
```

## Deployment

This app is configured for Vercel deployment. Simply connect your GitHub repository to Vercel and add the environment variables in the Vercel dashboard.

## API Endpoints

- `POST /api/shiphero/auth/refresh` - Authenticate with ShipHero
- `POST /api/process-csv` - Process CSV and update products

## Technologies

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Papa Parse (CSV parsing)
- Lucide React (icons)
- ShipHero GraphQL API
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables

This project reads contract addresses from environment variables so they are not hard-coded in the source.

1. Copy the example env file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and set the correct values for your deployment (contract addresses, network).

3. Start the dev server:

```bash
npm install
npm run dev
```

Note: Client-side variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser.

## Deploying to Vercel

Quick steps to deploy this project to Vercel:

1. Push your repository to GitHub (or connect your Git provider).
2. Go to https://vercel.com and import the repository.
3. During import, set the "Root Directory" to `frontend` so Vercel builds the Next app in that folder.
4. In the Vercel project settings -> Environment Variables, add the variables from `.env.example` (use the _Production_ environment for live values):

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_COLLATERAL_ADDRESS=0x...
NEXT_PUBLIC_PRICEFEED_ADDRESS=0x...
```

5. Leave Build Command as `npm run build` and Output Directory empty (Vercel will detect Next).
6. Deploy. After the build finishes, the site will be available on your Vercel domain.

Notes:

- If you don't set the root directory during import, Vercel may attempt to build the repository root; you can either set the root there or create a project with the frontend folder as the root.
- The file `frontend/vercel.json` is provided to help Vercel detect the Next.js app if it can't auto-detect the project root.

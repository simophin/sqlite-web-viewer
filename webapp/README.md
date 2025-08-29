# SolidJS SQLite Web Viewer

This is a SolidJS frontend web app for browsing SQLite databases via a backend API.

## Features
- Browse tables and views
- Sort and paginate columns
- Refresh data
- Decode JSON values
- View table/view schema in a horizontal tab
- Run raw SQL queries and display results

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```

## API
The backend API should accept SQL queries and return results as JSON (column names and rows).

## Customization
Modify or extend components in the `src/` directory to add features or change UI behavior.

## Usage

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)

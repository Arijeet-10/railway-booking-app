# RailEase

RailEase is a Next.js application for searching, viewing, and booking train tickets, enhanced with AI-powered smart route suggestions.

## Getting Started

This is a NextJS starter in Firebase Studio.

To get started:

1.  **Configure Firebase**:
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable Email/Password authentication in Firebase Authentication.
    *   Copy your Firebase project's web configuration credentials.
    *   Create a `.env.local` file in the root of the project and add your Firebase config:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        ```
    *   Replace `YOUR_...` values with your actual Firebase project credentials. These are also used in `src/lib/firebase/config.ts` as fallbacks if environment variables are not set, but using `.env.local` is recommended.

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002` (or the port specified in your `package.json` dev script).

## Core Features

-   **Train Search**: Search for trains based on origin, destination, and date.
-   **Seat Availability**: View available seats for a selected train (mock data).
-   **User Authentication**: Create user accounts with email verification using Firebase Authentication.
-   **Booking History**: Display user booking history (mock data).
-   **Profile Management**: View and edit user profile (display name).
-   **Smart Suggestions**: AI-powered tool for train route recommendations.

## Tech Stack

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   ShadCN UI Components
-   Firebase (Authentication)
-   Genkit (for AI features)

## Project Structure

-   `src/app/`: Contains all routes and page components.
-   `src/components/`: Reusable UI components.
    -   `ui/`: ShadCN UI components.
    -   `auth/`, `trains/`, `bookings/`, `profile/`, `smart-suggestions/`: Feature-specific components.
-   `src/lib/`: Utility functions, Firebase configuration, type definitions.
    -   `firebase/`: Firebase setup and authentication functions.
    -   `types.ts`: Shared TypeScript types.
-   `src/hooks/`: Custom React hooks (e.g., `useAuth`).
-   `src/ai/`: Genkit AI flow configurations.
    -   `flows/smart-train-suggestions.ts`: Pre-built AI flow for route suggestions.

## Environment Variables

See `src/lib/firebase/config.ts` for Firebase configuration. It's recommended to use a `.env.local` file for these values:

-   `NEXT_PUBLIC_FIREBASE_API_KEY`
-   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
-   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
-   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
-   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
-   `NEXT_PUBLIC_FIREBASE_APP_ID`

Additionally, Genkit (Google AI) may require its own environment variables for API keys if you modify or extend the AI flows. Check `src/ai/dev.ts` and `src/ai/genkit.ts`.
```
DOTENV_CONFIG_PATH=../../.env
GOOGLE_API_KEY=your_google_ai_api_key_here 
```
Place these in an `.env` file inside the `src/ai` directory if needed for local Genkit development, or manage them as appropriate for your deployment. The provided `src/ai/dev.ts` uses `dotenv` which would look for an `.env` file in the project root by default or as specified.
The `genkit:dev` script in `package.json` points to `src/ai/dev.ts`.
Ensure your `.env` file is in the root of the project for `dotenv` used by `src/ai/dev.ts` to pick it up unless `config({ path: '...' })` is changed.

## Further Development

-   Implement actual booking logic (currently mocked).
-   Connect to a real train data API for search and availability.
-   Store user bookings and profile details in Firestore.
-   Expand AI suggestions with more personalized data.

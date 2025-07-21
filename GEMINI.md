# UI and Frontend

- Always follow the style guidelines from pages already done
- Use the same brand colors used in other pages
- Always use Shadcn components if non native components are created in the project
- Focus on creating meaningful micro interactions that improve user experie

# Project Documentation: painel-ecprojetos

## 1. Project Overview
This project is a web application built with Next.js, designed to manage internal processes such as time control, career plans, and other related functionalities.

## 2. Technology Stack
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS, Shadcn UI
- **Database/Auth**: Supabase
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Form Management**: React Hook Form, Zod
- **Charting**: Recharts, Shadcn UI

## 3. Project Structure
- `src/app`: Contains the main application routes, layouts, and pages.
  - `(auth)`: Authentication-related pages (login, forgot password, reset password).
  - `(private)`: Protected routes for authenticated users.
  - `actions`: Server actions for data manipulation.
  - `api`: API routes.
- `src/components`: Reusable UI components.
  - `sidebar`: Components related to the application sidebar navigation.
  - `ui`: Shadcn UI components.
- `src/constants`: Application-wide constants (e.g., skill definitions, roles).
- `src/db`: Database schema or migration files.
- `src/hooks`: Custom React hooks.
- `src/lib`: Utility functions.
- `src/stores`: Zustand stores for global state management.
- `src/types`: TypeScript type definitions.
- `src/utils`: General utility functions, including Supabase client setup.
- `public`: Static assets like images.

## 4. Key Features
- User Authentication (Login, Forgot Password, Reset Password)
- Time Control Management (Alocar Horas, Historico)
- Career Plan (Plano Carreira, Avaliar, View)
- User and Project Management
- Dynamic Sidebar Navigation

## 5. Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun

### Environment Variables
Create a `.env.local` file in the root directory based on `.env.exemple` and populate it with your Supabase project details:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd painel-ecprojetos
   ```
2. Install dependencies:
   ```bash
   npm install
   # or yarn install
   # or pnpm install
   # or bun install
   ```

## 6. Running the Application

### Development
To run the development server:
```bash
npm run dev
# or yarn dev
# or pnpm dev
# or bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
To build the application for production:
```bash
npm run build
# or yarn build
# or pnpm build
# or bun build
```

### Starting Production Server
To start the production server after building:
```bash
npm run start
# or yarn start
# or pnpm start
# or bun start
```

## 7. Authentication
The application uses Supabase for authentication. User sessions are managed using Supabase's SSR capabilities. Authentication forms are located in `src/app/(auth)`. Server actions in `src/app/actions` handle authentication logic.

## 8. UI Components
The project utilizes [Shadcn UI](https://ui.shadcn.com/) for pre-built, accessible, and customizable UI components. Custom components are developed in `src/components`.

## 9. State Management
Global state is managed using [Zustand](https://zustand-bear.github.io/zustand/). Stores are defined in the `src/stores` directory, for example, `userStore.ts` for user-related state.

## 10. Data Management
Data fetching and mutations are primarily handled through Next.js Server Actions (`src/app/actions`) and integrated with [React Query](https://tanstack.com/query/latest) for caching, synchronization, and server state management. Supabase is used as the backend database.

## 11. Styling
[Tailwind CSS](https://tailwindcss.com/) is used for utility-first styling, allowing for rapid UI development and consistent design.

## 12. Sidebar Navigation
The sidebar navigation is a hierarchical structure built with a main `AppSidebar` component (`src/components/sidebar/app-sidebar.tsx`) orchestrating various `Nav` components (e.g., `nav-colaborador.tsx`, `nav-general.tsx`). Nested menus are achieved using the `Collapsible` component from `@/components/ui/collapsible`. Refer to `GEMINI.md` for a detailed explanation of the nested sidebar components.

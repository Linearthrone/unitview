# UnitView - A Patient Management Dashboard

UnitView is a web application designed for hospital charge nurses to get a real-time, at-a-glance overview of their unit. It provides a drag-and-drop interface to manage patient rooms, nurse assignments, and key clinical data. This project is built with Next.js, React, Tailwind CSS, and uses Firebase Firestore for its backend.

## Key Features

- **Visual Grid Layout:** An interactive grid representing the physical layout of the hospital unit.
- **Draggable Cards:** Patient rooms, nurses, and other staff can be dragged and dropped around the grid.
- **Dynamic Data Display:** Patient cards show essential information like name, alerts (Fall Risk, DNR), assigned nurse, and mobility status.
- **Staff Assignment:** Easily assign patients to nurses by dragging patient cards onto nurse assignment lists. Patient Care Tech assignments are calculated automatically.
- **Real-time Updates:** All changes to the layout and assignments are auto-saved to Firestore.
- **Customizable Layouts:** Save the current grid configuration as a new, named layout. Create new units from scratch with a specified number of rooms.
- **Printable Reports:** Generate and print a "Charge Report" with detailed patient summaries and a "Shift Assignments" sheet.
- **Staff & Resource Management:** Dialogs to add/remove staff members and manage the pool of available SpectraLink phones.

## Application Architecture

The application follows a standard client-server architecture using modern web technologies.

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) with the App Router.
- **UI Library:** [React](https://reactjs.org/) for building components.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/) provides the primitives for UI elements like dialogs, cards, and buttons.
- **State Management:** Client-side state is managed within the main page component (`src/app/page.tsx`) using React Hooks (`useState`, `useEffect`, `useCallback`).

### Backend

- **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) is used as the NoSQL database for all persistent data.
- **Data Flow:** The frontend communicates with Firestore through a "services" layer. This design pattern keeps the data-fetching and data-writing logic separate from the UI components.

## How Data is Stored and Written

The application is architected to keep the UI and data logic separate for better maintainability.

1.  **UI Components (`/src/components`)**: These are the building blocks of the interface (e.g., `PatientBlock`, `NurseAssignmentCard`). They are responsible for displaying data and capturing user interactions (clicks, drags). They do not directly fetch or save data. Instead, they call functions passed down as props from the main page.

2.  **Main Page (`/src/app/page.tsx`)**: This is the central hub of the application.
    - It holds all the primary data (patients, nurses, etc.) in its state.
    - It passes data down to the UI components for rendering.
    - It contains all the handler functions (e.g., `handleSavePatient`, `handleDropOnCell`) that modify the state.
    - When the state is updated, it triggers an auto-save `useEffect` hook.

3.  **Services Layer (`/src/services`)**: This directory contains files that act as a bridge to Firestore.
    - Each service (e.g., `patientService.ts`, `nurseService.ts`) is responsible for a specific data domain.
    - They contain functions like `getPatients`, `savePatients`, `getNurses`, `saveNurses`.
    - The main page calls these functions to fetch initial data and to save any changes. This is the only part of the application that directly imports and uses the Firebase SDK.

4.  **Firestore Database**:
    - Data is organized into collections. For example, each "layout" has its own set of documents for patients, nurses, and techs.
    - A central `appState` collection stores global configuration, like the list of available layouts and user preferences.
    - This structure allows multiple different unit layouts to be stored and loaded independently.

### Data Flow Example: Moving a Patient

1.  **User Action:** A user drags a `PatientBlock` from one grid cell to another.
2.  **UI Event:** The `onDropOnCell` event handler in `PatientGrid` is triggered.
3.  **State Update:** `PatientGrid` calls the `handleDropOnCell` function (passed as a prop from `page.tsx`). This function updates the `patients` array in the main page's state, changing the `gridRow` and `gridColumn` for the moved patient.
4.  **Auto-Save:** The `useEffect` hook in `page.tsx` detects the change in the `patients` state. It calls the `handleAutoSave` function.
5.  **Service Call:** `handleAutoSave` calls `patientService.savePatients(currentLayoutName, patients)`.
6.  **Firestore Write:** The `savePatients` function in the service layer takes the entire updated `patients` array and writes it to the appropriate collection in Firestore, overwriting the old data for that layout.

## Project Structure

```
/src
├── app/
│   ├── page.tsx          # Main application component, state management
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles and Tailwind directives
├── components/
│   ├── ui/               # ShadCN UI components
│   ├── app-header.tsx    # The main header
│   ├── patient-grid.tsx  # The grid container
│   ├── patient-block.tsx # The patient card
│   └── ...               # Other components
├── hooks/
│   └── use-toast.ts      # Toast notification hook
├── lib/
│   ├── firebase.ts       # Firebase initialization
│   ├── utils.ts          # Utility functions (e.g., cn for classnames)
│   └── ...               # Initial data generators, mock data
├── services/
│   ├── patientService.ts # Functions for fetching/saving patient data
│   ├── nurseService.ts   # Functions for fetching/saving nurse/tech data
│   └── ...               # Other services
└── types/
    ├── patient.ts        # TypeScript types for Patient, Layouts, etc.
    ├── nurse.ts          # TypeScript types for Nurse, Tech, Spectra
    └── forms.ts          # Zod schemas for form validation
```

## Getting Started

To run this project locally:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up Firebase:**
    - Create a Firebase project.
    - Enable Firestore.
    - Get your Firebase configuration keys and add them to a `.env.local` file in the root of the project. See `.env.example` for the required variables.
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

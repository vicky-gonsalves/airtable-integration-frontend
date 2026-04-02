# Airtable Integration Frontend

This project is a modern Angular 19 frontend application designed to interface with an Airtable synchronization backend. It allows users to authenticate with their Airtable accounts, browse workspaces (bases) and tables, view synchronized data through an advanced data grid, and inspect detailed record revision histories.

<img width="1919" height="897" alt="4" src="https://github.com/user-attachments/assets/186a3a32-5b1b-4012-ab73-a153630f6e33" />
<img width="1901" height="890" alt="image" src="https://github.com/user-attachments/assets/7ca27dc7-b894-4d06-9d93-7982b4d9f92f" />


## Key Features

* **Airtable Authentication:** Connects user accounts via OAuth. Includes robust session management using HTTP Interceptors (`auth.interceptor`) and Route Guards (`auth.guard`, `guest.guard`) to handle expired sessions gracefully.
* **Workspace Management:** State management powered by Angular Signals (`WorkspaceStateService`) to efficiently cache and retrieve Airtable bases and tables.
* **Advanced Data Grid:** Utilizes `ag-grid-angular` with an infinite row model to display large datasets efficiently.
* **Dynamic Filtering & Search:** Custom utility (`AirtableGridFilterUtil`) that translates AG Grid complex filter models into Airtable-compatible formula syntax (e.g., `FIND`, `SEARCH`, `AND`, `OR`).
* **Record Deep-Dives:** A dynamic dialog (`TicketDialogComponent`) that recursively parses and renders complex nested JSON fields, alongside a scrollable timeline of revision histories.
* **Data Synchronization & MFA:** Triggers backend syncs for current table data and historical revisions. Includes a dedicated UI (`ScraperMfaDialogComponent`) to collect credentials and MFA codes for backend scraper authentication.

## Tech Stack

* **Framework:** Angular 19 (Standalone Components, Signals, new `@if`/`@for` control flow)
* **UI Library:** Angular Material (Cards, Dialogs, Toolbars, Spinners, Snackbars)
* **Data Grid:** AG Grid Community
* **State Management:** Angular Signals & RxJS


## Setup and Installation

To get the project up and running on your local machine, follow these steps:

### 1. **Clone the repository:**
```bash
git clone <your-repository-url>
cd <your-project-directory>
```
### 2. Install dependencies:

```bash 
yarn install 
```

### 3. Configure the Environment:  
- By default, the application expects a local backend server running on port `3000`.
- If your backend is hosted elsewhere, update the `apiHost` variable in `src/environments/environment.ts`.

### 4. Development server
```bash
yarn run serve
```

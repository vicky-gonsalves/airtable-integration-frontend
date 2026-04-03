# Airtable Integration Workspace (Frontend)

![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-v19-DD0031?logo=angular&logoColor=white)
![AG Grid](https://img.shields.io/badge/AG_Grid-v33.0-2196F3?logo=aggrid&logoColor=white)
![Angular Material](https://img.shields.io/badge/Material-UI-FF7043?logo=angular&logoColor=white)

This project is a modern, highly responsive **Angular 19** frontend application designed to interface with the Airtable synchronization and scraping backend. It allows users to authenticate with their Airtable accounts, dynamically browse workspaces and tables, view synchronized data through an advanced data grid, and inspect detailed, hidden record revision histories.

## Interface Snapshots

**Main Dynamic Data Grid & Navigation:**
<img width="1919" height="897" alt="Main Grid Interface" src="https://github.com/user-attachments/assets/186a3a32-5b1b-4012-ab73-a153630f6e33" />

**Ticket & Revision History Deep-Dive**
<img width="1901" height="890" alt="Ticket Dialog Interface" src="https://github.com/user-attachments/assets/7ca27dc7-b894-4d06-9d93-7982b4d9f92f" />

---

## Key Features & Requirements Met

This frontend was built specifically to fulfill the dynamic grid and scraping interface requirements:

### 1. Dynamic Workspace & Grid (Part C)
* **Entity & Integration Selection:** Features intuitive dropdowns to select Active Integrations (Airtable) and specific Entities (database collections/tables).
* **Advanced AG Grid Integration:** Utilizes `ag-grid-angular` with an infinite row model to efficiently display large datasets.
* **Dynamic Columns:** Automatically retrieves fields dynamically based on the selected collection and generates the grid columns on the fly.
* **Global Search & Filtering:** Custom utility (`AirtableGridFilterUtil`) that seamlessly translates complex AG Grid filter models into backend-compatible queries, applying global search and column-specific sorting.

### 2. Scraper Control & MFA (Part B)
* **MFA Code Injection:** Includes a dedicated UI (`ScraperMfaDialogComponent`) to collect credentials and MFA codes from the user and pass them to the backend, enabling the Puppeteer scraper to bypass Airtable's login security.
* **Data Synchronization:** Triggers backend syncs on-demand for standard table data and historical revisions.

### 3. Record Deep-Dives & Revisions
* **Ticket Dialog (`TicketDialogComponent`):** A dynamic modal that recursively parses and renders complex nested JSON fields from Airtable records.
* **Revision Timeline:** Displays a scrollable timeline of scraped revision histories, specifically highlighting **Assignee** and **Status** changes over time.

### 4. Modern Angular Architecture
* **State Management:** Powered by Angular Signals (`WorkspaceStateService`) to efficiently cache, update, and retrieve Airtable bases and tables without heavy RxJS boilerplate.
* **Authentication Flow:** Robust session management utilizing HTTP Interceptors (`auth.interceptor`) and Route Guards (`auth.guard`, `guest.guard`) to handle expired sessions and OAuth redirects gracefully.

---

## Tech Stack

* **Framework:** Angular 19 (Utilizing Standalone Components, Signals, and the new `@if`/`@for` control flow)
* **Runtime Requirement:** Node.js v22
* **Data Grid:** AG Grid Community & AG Charts (v33.0)
* **UI Library:** Angular Material (Cards, Dialogs, Toolbars, Spinners, Snackbars) & Material Icons
* **State Management:** Angular Signals & RxJS

---

## Setup and Installation

To get the project up and running on your local machine, follow these steps:

### 1. Prerequisites
Ensure you have **Node.js v22** installed, as this is a strict requirement for the environment.

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd <your-frontend-directory>
```

### 3. Install Dependencies
```bash 
yarn install 
```

### 4. Configure the Environment
By default, the application expects a local backend server running on port `3000`.
If your backend is hosted elsewhere, update the `apiHost` variable in `src/environments/environment.ts` and `src/environments/environment.development.ts`.

```typescript
export const environment = {
  production: false,
  apiHost: 'http://localhost:3000' // Ensure this matches your NestJS backend URL
};
```

### 5. Run the Development Server
```bash
yarn run start
# or 
ng serve
```
Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any of the source files.

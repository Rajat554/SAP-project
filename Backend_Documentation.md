# WashWizard Backend Documentation

## 1. Overview
The WashWizard backend is built using the **SAP Cloud Application Programming Model (CAP)** with Node.js. It leverages Core Data Services (CDS) to define data models and services, and it seamlessly exposes these models as OData APIs to be consumed by the SAP Fiori/UI5 frontend.

---

## 2. File Structure and Descriptions

### `db/schema.cds`
- **Role**: Defines the core data models (schema) and database tables.
- **Code Breakdown**:
  - `entity ServiceTask`: This is the primary database table. It stores all information related to a wash service.
  - Fields include `Guid` (Primary Key), contact details (`CustomerName`, `Phone`), vehicle details (`CarModel`, `VehiclePlate`), service/pricing (`ServiceType`, `Amount`, `PaymentMethod`), and lifecycle tracking details (`Status`, `Date`, `CompletedAt`).
- **How it works**: When deployed, the CAP framework translates this CDS definition into physical database tables (SQLite for local development, and SAP HANA for production).

### `srv/service.cds`
- **Role**: Defines the API service layer.
- **Code Breakdown**:
  - `service WashWizardService { ... }`: Defines a new OData service.
  - `entity ServiceTaskSet as projection on WashWizard.ServiceTask;`: Exposes the underlying database table to the outside world as an OData entity named `ServiceTaskSet`.
- **How it works**: CAP automatically generates fully functional, secure CRUD (Create, Read, Update, Delete) APIs for this projection without needing you to write any manual SQL or routing code.

### `srv/service.js`
- **Role**: Contains custom business logic to intercept and manipulate API requests before they reach the database.
- **Code Breakdown**:
  - `this.before('CREATE', ...)`: Intercepts new incoming records. It automatically generates a UUID for the `Guid`, sets the initial `Status` to 'Pending', and sets the creation `Date` to today's date if the frontend didn't provide one.
  - `this.before('UPDATE', ...)`: Intercepts updates. If a task's status is changed to 'Completed', it automatically populates the `CompletedAt` timestamp with today's date.
- **How it works**: This file acts as a middleware. It ensures data consistency and automates application lifecycle logic centrally on the server.

### `package.json` & `mta.yaml`
- **Role**: Configuration and deployment files.
- **How it works**: `package.json` configures local dependencies and tells CAP to use SQLite locally and HANA in production. `mta.yaml` is the SAP BTP deployment descriptor that packages our frontend, backend, and database into a single deployable archive.

---

## 3. Searching and Filtering: How it Works (Server-Side)

### Is searching just happening on the frontend?
**No.** In the WashWizard application (and standard SAP apps), searching and filtering happen at the **Backend Database Level**, not just in the frontend UI. 

### The Librarian Analogy (Simple Language)
Think of the backend like a very smart librarian. If you want books about "Cars", the librarian doesn't bring the entire library's books to your desk for you to sort through (Frontend searching). Instead, you ask the librarian for "Cars", the librarian goes to the back room, searches the shelves (Backend Database), and brings exactly the 5 books you need to your desk. 

### How it happens (SAP Developer Language):
When you type a search term or apply a filter in your SAPUI5 frontend:
1. **Frontend Request (Delegation)**: UI5 does *not* download all the data. It uses a **Server-Side OData Model**. It generates an HTTP GET request with OData query parameters. 
   - *Example*: If you filter by Pending status, UI5 sends: `GET /odata/v2/wash-wizard/ServiceTaskSet?$filter=Status eq 'Pending'`
2. **Backend Translation (CAP Magic)**: The SAP CAP backend receives this OData request. CAP has a built-in query engine that automatically translates OData syntax (`$filter`, `$search`, `$top`, `$skip`) into a raw SQL query.
   - *Example SQL*: `SELECT * FROM ServiceTask WHERE Status = 'Pending'`
3. **Database Execution**: This SQL query is executed directly on the database engine (SQLite locally, SAP HANA in production). 
4. **Targeted Response**: The database returns only the matching records, which are then sent back to the browser.

### Why is this important?
- **Performance**: If you have 100,000 service records, downloading all of them to the browser would crash the app. By filtering at the backend, only a few kilobytes of data are sent over the network.
- **Accurate Pagination**: Server-side filtering works perfectly with pagination. The database filters the 100,000 records down to 500 matches, and then the `$top` and `$skip` parameters ensure the backend only sends the first 10 matches for "Page 1".

---

## 4. What We Have Built Till Now in the Backend

Here is exactly what the backend system is currently doing for your application:

1. **The Foundation (Database Schema)**: We built a robust database layout in `schema.cds` to hold WashWizard service data.
2. **The Bridge (OData Service)**: We built an API layer in `service.cds` that exposes this data to the web securely.
3. **The Brains (Custom Logic)**: We wrote custom Node.js logic in `service.js` to automatically handle ID generation, date stamping, and status changes so the frontend doesn't have to worry about it.
4. **The Translator (V2 Proxy)**: We added a special tool (`@cap-js-community/odata-v2-adapter`) that allows our modern backend to perfectly understand the older, standard SAPUI5 components you are using in the frontend.
5. **The Engine (SQLite/HANA)**: We configured it to run instantly on your local machine using SQLite, while being perfectly ready to switch to the enterprise-grade SAP HANA database when uploaded to SAP BTP.

---

## 5. How CAP OData Differs From Standard Web Backends (e.g., Express/REST)

1. **Zero-Boilerplate**: In standard web development, you write SQL queries and routing logic for every single API endpoint. In SAP CAP, you just define the data model in CDS, and CAP writes the APIs for you.
2. **Built-in Advanced Querying**: CAP handles sorting, filtering, and pagination natively through OData. You never had to write a single line of code to make the search bar work in the backend—CAP handled the translation automatically.
3. **Metadata-Driven**: OData provides a `$metadata` document. SAP UI5 reads this document to understand exactly what the backend looks like, allowing it to build forms and tables dynamically.

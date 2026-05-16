# WashWizard Enterprise Application

Welcome to the **WashWizard** project! This is an enterprise-grade web application designed to efficiently manage services, records, analytics, and user access. The app provides a robust administrative experience tailored for real-time service tracking and history management.

## 📱 Pages and Application Flow

The application is structured into four main sections, each serving a distinct purpose in the business workflow:

### 1. Dashboard Page
The heart of active operations.
- **Functionality**: Users can add new services and manage currently ongoing services.
- **Use Case**: This is where day-to-day active tasks are monitored, ensuring nothing falls behind schedule.

### 2. Service Record Page
The historical archive and billing center.
- **Functionality**: Acts as a comprehensive history of all past completed services.
- **Features**: Includes a **Print Bill** option. This feature dynamically generates a bill for a completed service and allows you to print it directly via a **Bluetooth printer**, enabling seamless physical receipt generation on the go.

### 3. Analysis Page
The insights and metrics hub.
- **Functionality**: Displays rich analytics regarding the services provided.
- **Metrics**: Shows which services are most frequently used, overall performance metrics, and other critical business data at a glance, allowing management to make data-driven decisions.

### 4. Settings Page
The administrative control panel.
- **Functionality**: Administrators can manage app configurations and add new users to the system.
- **Security & Role-Based Auth**: The application utilizes strict Role-Based Access Control (RBAC). When adding users, admins assign specific roles (e.g., Admin, User). The backend enforces these roles, ensuring that sensitive areas (like Settings or Analytics) are only accessible to authorized personnel, while standard users can only access operational pages like the Dashboard.

---

## 🛠 Tech Stack

The application is built using a modern, scalable enterprise stack:

- **Frontend**: **SAP UI5** (Fiori Design Guidelines)
  - Provides a responsive, accessible, and enterprise-ready user interface.
- **Backend**: **SAP Cloud Application Programming (CAP) Model** (Node.js)
  - Handles business logic, OData V4 service provisioning, and secure data transactions.
- **Database**: **SAP HANA Cloud** (Production) / **SQLite** (Local Development)
  - Ensures high-performance data storage and retrieval.
- **Security**: **SAP XSUAA & JWT (JSON Web Tokens)**
  - Manages secure authentication and role-based authorization flows.

---

## ☁️ Deployment and Management on SAP BTP

WashWizard is designed to be hosted and managed on the **SAP Business Technology Platform (BTP)**:

- **Deployment**: The app uses the `mta.yaml` (Multi-Target Application) descriptor for streamlined deployment to SAP BTP Cloud Foundry environment.
- **Routing**: The SAP Approuter manages incoming traffic, serving static frontend files and routing API requests to the CAP backend.
- **Services Management**: BTP services like HANA Cloud (for database) and XSUAA (for identity and authorization) are bound to the application.
- **Scalability**: BTP allows the application to automatically scale based on traffic, and enables easy monitoring of logs and application health via the BTP Cockpit.

---

## 🌿 Repository Structure (Branches)

This GitHub repository is organized into two primary branches to separate frontend-only deployment from the complete full-stack environment:

- **`main` Branch**
  - **Contents**: Contains **ONLY the frontend code** (SAP UI5).
  - **Purpose**: Used for deploying the frontend as a standalone application or for static hosting scenarios where the backend is hosted entirely separately.

- **`devbranch` Branch**
  - **Contents**: Contains the **FULL STACK code** (Frontend + Backend + Database Logic).
  - **Purpose**: This is the comprehensive development branch containing the SAP UI5 web app, the CAP Node.js backend services (`srv/`), the database schema (`db/`), and all deployment configurations (`mta.yaml`). Use this branch for full local development and end-to-end testing.

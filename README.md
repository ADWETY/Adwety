<div align="center">

# ADWETY — أدويتي

### Smart Pharmacy Management & Retail Operations Platform

**منصة ويب متكاملة لإدارة الصيدليات، المخزون، نقاط البيع، التقارير، الخزينة، والمستخدمين من خلال لوحة تحكم حديثة وآمنة.**

<br />

![Graduation Project](https://img.shields.io/badge/Graduation%20Project-2026-0EA5E9?style=for-the-badge)
![Full Stack](https://img.shields.io/badge/Full--Stack-MERN-10B981?style=for-the-badge)
![Dashboard](https://img.shields.io/badge/Responsive-Dashboard-6366F1?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-22C55E?style=for-the-badge)

</div>

---

## Project Overview

**ADWETY** is a full-stack pharmacy management system designed to digitalize the daily workflow of pharmacies and provide administrators with centralized control over pharmacy branches, users, inventory, financial movements, invoices, and operational reports.

The project focuses on solving real pharmacy workflow problems by combining a clean dashboard experience with backend-driven business logic. It helps pharmacy teams reduce manual work, track stock accurately, manage sales through a POS system, and monitor financial activity through a structured treasury module.

ADWETY is built as a graduation project with a production-style architecture, role-based access control, bilingual interface support, responsive layouts, and a modular codebase that can be extended into a real commercial SaaS platform.

---

## Project Vision

The main vision of **ADWETY** is to create a practical digital solution that transforms pharmacy operations from scattered manual processes into one organized, secure, and measurable system.

Instead of handling products, invoices, customers, suppliers, treasury records, and reports separately, the platform brings these operations together inside one unified dashboard where each user sees only the tools and data relevant to their role.

---

## The Problem ADWETY Solves

Many small and medium pharmacies still depend on disconnected tools, paper records, or simple spreadsheets to manage daily work. This creates several operational problems:

| Challenge | Impact |
|---|---|
| Manual stock tracking | Product quantities become inaccurate and hard to audit. |
| Weak sales management | Invoices and payment states are difficult to follow. |
| Poor financial visibility | Treasury movements are not clearly connected to sales and purchases. |
| Limited reporting | Decision-making becomes slow and based on incomplete data. |
| Uncontrolled permissions | Users may access data or actions outside their role. |
| Non-responsive systems | Mobile and small-screen usage becomes difficult for pharmacy staff. |

**ADWETY** addresses these issues by providing a centralized digital workflow built around real pharmacy operations.

---

## Target Users

| User Type | Main Responsibility |
|---|---|
| **System Admin** | Manages pharmacies, users, approvals, reports, analytics, support, and system-level operations. |
| **Pharmacy Staff** | Manages POS sales, products, warehouses, invoices, customers, suppliers, returns, treasury, and daily reports. |

The system is intentionally focused on **Admin** and **Pharmacy** roles to keep the workflow clean, controlled, and aligned with pharmacy operations.

---

## Key Features

### Pharmacy Administration

- Pharmacy creation and management.
- Pharmacy approval workflow.
- User and role management.
- Pharmacy details and operational overview.
- Centralized admin dashboard.
- Support ticket handling.
- Notifications management.
- Analytics and reporting pages.

### Point of Sale System

- Fast pharmacy sales workflow.
- Product search and selection.
- Invoice creation.
- Payment tracking.
- Customer-linked sales.
- Pharmacy-scoped retail operations.
- Structured sales records for later review.

### Inventory & Warehouse Management

- Product and medicine management.
- Store and warehouse organization.
- Category management.
- Stock quantities tracking.
- Low-stock monitoring.
- Inventory movement visibility.
- Warehouse-based filtering and reporting.

### Invoices & Returns

- Sales invoices.
- Purchase invoices.
- Return operations.
- Invoice status tracking.
- Payment state tracking.
- Search and filtering by type, date, warehouse, and status.

### Treasury Module

- Financial movement tracking.
- Paid and remaining amount visibility.
- Sale and purchase financial records.
- Date-based filtering.
- Export and print actions.
- Mobile-friendly treasury layout for small screens.

### Reports & Analytics

- Operational reports.
- Sales and inventory insights.
- Pharmacy performance indicators.
- Filtered reporting by pharmacy, date, and store.
- Decision-support dashboard screens.

### Notifications & Support

- System notifications.
- Pharmacy-related alerts.
- Support tickets between users and administration.
- Review and response workflow.

### Bilingual User Interface

- Arabic interface support.
- English interface support.
- RTL-friendly dashboard behavior.
- Responsive UI adjustments for desktop and mobile usage.

---

## System Architecture

ADWETY follows a separated **Frontend / Backend** architecture, which improves maintainability, scalability, and future deployment flexibility.

```text
ADWETY
│
├── Frontend Dashboard
│ ├── React UI
│ ├── Role-Based Pages
│ ├── Responsive Layouts
│ ├── Arabic / English Interface
│ └── API Integration Layer
│
├── Backend API
│ ├── Authentication
│ ├── Authorization
│ ├── Business Logic
│ ├── Validation
│ ├── Security Middleware
│ └── RESTful Endpoints
│
└── Database Layer
 ├── Users
 ├── Pharmacies
 ├── Products
 ├── Warehouses
 ├── Invoices
 ├── Treasury Records
 ├── Notifications
 └── Support Tickets
```

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React** | Building dynamic user interfaces. |
| **Vite** | Fast frontend development and optimized builds. |
| **Tailwind CSS** | Modern responsive styling. |
| **React Router** | Client-side routing and page navigation. |
| **Lucide React** | Clean dashboard icons. |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for backend services. |
| **Express.js** | REST API framework. |
| **MongoDB** | NoSQL database for flexible pharmacy data. |
| **Mongoose** | Data modeling and schema management. |
| **JWT** | Token-based authentication. |
| **BcryptJS** | Password hashing. |
| **Helmet** | HTTP security headers. |
| **CORS** | Secure cross-origin communication. |
| **Zod** | Request validation. |
| **Nodemailer** | Email and OTP-related communication. |
| **Multer / Sharp** | File and image processing when needed. |

---

## Security & Access Control

Security is a core part of the project structure. ADWETY applies several protection layers to ensure that every user interacts only with the data and actions allowed for their role.

| Security Area | Implementation Focus |
|---|---|
| **Authentication** | Secure login flow using token-based authentication. |
| **Password Protection** | Password hashing before storage. |
| **Role-Based Access** | Admin and Pharmacy users have separated permissions. |
| **Protected Routes** | Dashboard pages and APIs are restricted by role. |
| **Input Validation** | Backend validation before processing requests. |
| **Security Headers** | HTTP protection using security middleware. |
| **Controlled API Access** | Backend endpoints are organized and protected. |

---

## User Experience

ADWETY was designed with a dashboard-first experience. The interface aims to be clean, readable, and practical for daily use inside a pharmacy environment.

### UI Highlights

- Modern dashboard layout.
- Organized sidebar navigation.
- Clear page structure.
- Action buttons for fast workflow.
- Filter cards for searching and reporting.
- Responsive behavior for small screens.
- Mobile-friendly table/card views.
- Arabic RTL layout support.
- Consistent colors, spacing, and icon usage.

---

## Responsive Design

The platform includes dedicated responsive behavior for smaller screens. On mobile widths, complex table data is rearranged into cleaner vertical cards to keep important information visible and readable.

This improves usability for pharmacy staff who may need to review invoices, treasury records, products, or reports from tablets and small devices.

---

## Main Modules

| Module | Description |
|---|---|
| **Dashboard** | Main overview screen for quick access to system activity. |
| **Pharmacies** | Manage pharmacy records and operational details. |
| **Users** | Control users, roles, and system access. |
| **Products** | Manage pharmacy products and medicine information. |
| **Warehouses** | Organize stock by store or warehouse. |
| **Categories** | Classify products for easier management. |
| **POS** | Handle retail sales and invoice creation. |
| **Invoices** | Track sales and purchase operations. |
| **Returns** | Manage returned items and related records. |
| **Treasury** | Follow financial payments, remaining amounts, and transaction status. |
| **Reports** | View operational and financial reports. |
| **Notifications** | Send and manage system alerts. |
| **Support Tickets** | Handle pharmacy support and communication. |
| **Settings** | Manage user preferences and system behavior. |

---

## Business Value

ADWETY is not just a technical dashboard; it represents a business-oriented solution for pharmacy management.

### Value for Pharmacy Owners

- Better control over stock.
- Faster sales workflow.
- Clear financial tracking.
- Reduced manual errors.
- Better reporting for decisions.
- Organized staff permissions.

### Value for System Administrators

- Centralized pharmacy supervision.
- Better user and pharmacy control.
- Easier operational monitoring.
- Improved support management.
- Scalable structure for future expansion.

### Value for Graduation Evaluation

- Real-world problem scope.
- Full-stack implementation.
- Database-backed business logic.
- Authentication and authorization.
- Responsive dashboard design.
- Clean modular architecture.
- Practical pharmacy use case.

---

## User Workflow Summary

```text
Admin creates or approves pharmacies
 ↓
Pharmacy staff manages warehouses and products
 ↓
Products are sold through the POS module
 ↓
Invoices are generated and tracked
 ↓
Treasury records reflect payment status
 ↓
Reports and analytics help monitor performance
```

This workflow connects the operational, financial, and administrative sides of the pharmacy into one coherent system.

---

## Project Structure Summary

```text
ADWETY/
├── Backend/
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── utils/
│ ├── app.js
│ └── index.js
│
├── Frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── context/
│ │ ├── lib/
│ │ ├── pages/
│ │ ├── App.jsx
│ │ └── main.jsx
│ └── vite.config.js
│
└── README.md
```

---

## Future Enhancements

The project can be extended with additional advanced features, such as:

- Barcode scanner integration.
- Advanced stock prediction.
- Multi-branch pharmacy chains.
- Detailed profit and loss reports.
- Supplier payment schedules.
- Audit logs for sensitive actions.
- Cloud deployment and SaaS subscription plans.
- Mobile application for pharmacy staff.
- AI-powered medicine search and smart recommendations.

---

## Project Identity

| Item | Details |
|---|---|
| **Project Name** | ADWETY — أدويتي |
| **Project Type** | Graduation Project |
| **Category** | Pharmacy Management System |
| **Architecture** | Full-Stack Web Application |
| **Main Stack** | MERN Stack |
| **Core Focus** | Pharmacy operations, POS, inventory, treasury, reports, and admin control |

---

<div align="center">

## ADWETY

**A smarter way to manage pharmacy operations.**

Built with care as a practical full-stack graduation project.

</div>

# **Contributing to MT-URBAC**

First off, thank you for considering contributing to MT-URBAC\! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.  
This document provides guidelines and instructions for contributing to this repository.

## **🏗️ Project Structure**

MT-URBAC is a fully decoupled application. The repository contains two distinct projects that need to be run separately:

> * **Backend:** NestJS (using TypeORM and PostgreSQL)  
> * **Frontend:** Angular (with PrimeNG and Tailwind CSS)

## **💻 Local Development Setup**

To get the project running locally for development, follow these steps:

### **Prerequisites**

> * Node.js (v18 or higher recommended)  
> * Angular CLI (npm install \-g @angular/cli)  
> * PostgreSQL running locally

### **1\. Database Setup**

Ensure you have a local PostgreSQL instance running. Create an empty database for the project (e.g., mt\_urbac\_db).

### **2\. Backend Setup (NestJS)**

> 1. Navigate to the backend directory:  
>    `cd backend`  
> 2. Install dependencies:  
>    `npm install`  
> 3. Configure your environment variables. Copy the .env.example file to .env and update your PostgreSQL connection credentials.  
> 4. Run the database seed script to provision the initial TypeORM entities and the Super Admin account:  
>    `npm run seed`  
> 5. Start the development server:  
>    `npm run start:dev`

### **3\. Frontend Setup (Angular)**

> 1. Open a new terminal window and navigate to the frontend directory:  
>    `cd frontend`  
> 2. Install dependencies:  
>    `npm install`  
> 3. Start the Angular development server:  
>    `ng serve`

The frontend will be available at http://localhost:4200.

## **🌿 Branching Strategy**

To keep the repository clean and easy to navigate, please use the following naming conventions for your branches:

> * feature/your-feature-name (For new features or enhancements)  
> * fix/your-bug-name (For bug fixes)  
> * docs/documentation-update (For updates to the README or other markdown files)

## **📝 Commit Message Convention**

We follow the Conventional Commits specification. Please structure your commit messages as follows:

> * feat: added audit logging to user module  
> * fix: resolved role escalation check in auth guard  
> * docs: updated setup instructions  
> * chore: updated Angular dependencies

## **🚀 Pull Request Process**

> 1. Fork the repository and create your branch from main.  
> 2. Ensure your code follows the existing style and linting rules.  
> 3. If you added a new backend module, ensure the TypeORM entities are strictly typed and relations are clearly defined.  
> 4. Update the documentation if you are changing an existing process or adding a new feature.  
> 5. Submit your Pull Request with a clear title and description. Include what problem you are solving and how you solved it.

### **Code Review**

Once your PR is submitted, a maintainer will review it. We might ask for some changes before merging to ensure everything aligns with the URBAC architecture. Don't worry-feedback is just part of the process\!

## **🐛 Reporting Bugs**

If you find a bug, please open an Issue before submitting a PR. Include:

> * A clear and descriptive title.  
> * Steps to reproduce the issue.  
> * Your environment details (Node version, OS, etc.).  
> * Any relevant error logs.

Thank you for helping make UMT-RBAC better\!

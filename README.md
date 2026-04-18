# Gully Stars

## Prerequisites

Before you start, make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) package manager

## Getting Started

1. **Clone the repository**
   Download or clone this repository to your local machine.

2. **Install dependencies**
   In the root folder of the project, run:
   ```bash
   pnpm install
   ```

3. **Run the Application (Web Version)**
   Navigate to the mobile app folder and start the web development server:
   ```bash
   cd artifacts/mobile
   pnpm run web
   ```
   
   This will automatically open the web version of the application in your default browser at `http://localhost:8081`. That's it!

## Workspaces
This application uses a pnpm workspace structure:
- `artifacts/mobile` - Contains the React Native Expo application.
- `scripts` - Internal utility scripts.

# JarNox Assignment Backend

This is the backend for the JarNox stock visualization project. It is built with **Node.js** and **Express**, and uses **PostgreSQL** for storing company codes. The backend fetches stock data from **Yahoo Finance** and provides it to the frontend via API endpoints.

---

## Features

- Provides REST API endpoints for retrieving company codes.
- Fetches stock data from Yahoo Finance dynamically.
- Supports multiple timeframes: last week, last month, last year.
- Hosted on Render for reliable access.

---

## Prerequisites

- Node.js v18+ installed
- PostgreSQL database
- npm or yarn

---

## Environment Variables

Create a `.env` file in the root directory with the following content:

```env
PORT=3000
DB_PORT=5432
DB_NAME=<YOUR_DATABASE_NAME>
DB_HOST=<YOUR_DATABASE_HOST>
DB_USER=<YOUR_DATABASE_USERNAME>
DB_PASSWORD=<YOUR_DATABASE_PASSWORD>

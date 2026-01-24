# ⚡ TaskFlow

**TaskFlow** is a modern, collaborative task manager and event scheduler designed to help you organize your work and plan your events efficiently.

## 🚀 Features

-   **Task Management**: Create, edit, delete, and organize tasks with priorities, deadlines, and statuses.
-   **Event Scheduling**: A full-featured calendar to manage events with reminders.
-   **Responsive Design**: Built with a mobile-first approach for seamless usage across devices.
-   **Hybrid Backend**:
    -   **Production (GitHub Pages)**: Runs in "Demo Mode" using `localStorage` (No backend required).
    -   **Local Development**: Connects to a PHP + MySQL backend for persistent data.

## 📂 Project Structure

```
taskflow/
├── frontend/        # Frontend code (HTML, CSS, JS)
│   ├── index.html   # Main application entry point
│   ├── css/         # Stylesheets
│   └── js/          # JavaScript logic
│
├── backend/         # Backend code (PHP + MySQL)
│   ├── api/         # API endpoints
│   ├── config.php   # Database configuration
│   └── schema.sql   # Database schema
│
└── README.md        # Project documentation
```

## 🛠️ Usage

### 1. Online Demo (GitHub Pages)
Visit the [Live Demo](#) (Replace with actual link once deployed).
*Note: The demo runs in "Mock Mode" where data is saved to your browser's Local Storage.*

### 2. Local Demo (Mock Mode)
You can test the frontend functionality without setting up a backend:
1.  Open `frontend/index.html` in your browser.
2.  Add `?demo=true` to the URL.
    *   Example: `file:///C:/path/to/taskflow/frontend/index.html?demo=true`
3.  You will see a banner confirming you are in **Demo Mode**.

### 3. Full Local Setup (PHP + MySQL)
To run the full application with a persistent database:

1.  **Prerequisites**: Install [XAMPP](https://www.apachefriends.org/) (or any PHP/MySQL environment).
2.  **Setup Database**:
    -   Start **Apache** and **MySQL** in XAMPP Control Panel.
    -   Open `http://localhost/phpmyadmin`.
    -   Create a new database named `taskflow`.
    -   Import `backend/schema.sql` into the `taskflow` database.
3.  **Configure Backend**:
    -   Open `backend/config.php` and check the database credentials (default is usually `root` with no password).
4.  **Run**:
    -   Place the project folder in `htdocs` (e.g., `C:\xampp\htdocs\TaskFlow`).
    -   Open `http://localhost/TaskFlow/frontend/` in your browser.

## 🤝 Contributing
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built for the Advanced Agentic Coding project.*

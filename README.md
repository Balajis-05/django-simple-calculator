# Modern Simple Calculator Web Application (Python Django)

A modern, responsive, and robust **Calculator Web Application** built with **Python Django**, **HTML5**, **CSS3**, and **Vanilla JavaScript**.

![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🌟 Key Features

- **Standard Arithmetic Operations**:
  - Addition (`+`)
  - Subtraction (`−`)
  - Multiplication (`×`)
  - Division (`÷`)
- **Advanced Controls**:
  - Decimal support (`.`) with precise floating-point rounding
  - Clear (`C`) and Backspace / Delete last digit (`⌫`)
  - Sign toggle (`±`) for positive/negative numbers
  - Percentage calculation (`%`)
- **Division by Zero Protection**: Gracefully handles division by zero with friendly feedback banners instead of crashing.
- **Full Keyboard Navigation**:
  - Digits `0-9`
  - Operators `+`, `-`, `*`, `/`
  - Enter / `=` to calculate
  - Backspace to delete last digit
  - Escape or `C` to clear
  - `%` for percentage
- **Modern Aesthetics & UX**:
  - Centered glassmorphic calculator card
  - Sleek dark theme with ambient glow lighting
  - Distinct color-coded buttons (numbers, operators, utilities, and equals)
  - Interactive click and keypress micro-animations
  - Dynamic result text auto-scaling for long outputs
  - Calculation history drawer with click-to-recall
  - Copy result to clipboard with toast notification
- **Backend Architecture**:
  - Clean Django project and app structure
  - AST-based safe math expression evaluator in Python (no unsafe `eval()`)
  - JSON API endpoint (`/api/calculate/`) for backend calculations
  - Full automated Django test suite covering views and arithmetic logic

---

## 📁 Project Structure

```text
simple calculator/
├── manage.py
├── requirements.txt
├── README.md
├── calculator_project/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── calculator/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── urls.py
    ├── views.py
    ├── tests.py
    ├── templates/
    │   └── calculator/
    │       └── index.html
    └── static/
        └── calculator/
            ├── css/
            │   └── style.css
            └── js/
                └── script.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ installed
- `pip` package manager

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations
Django's default SQLite database is ready to use:
```bash
python manage.py migrate
```

### 4. Run the Development Server
```bash
python manage.py runserver
```

Open your browser and navigate to:
```text
http://127.0.0.1:8000/
```

---

## 🧪 Running Automated Tests

Run the full Django test suite:
```bash
python manage.py test calculator
```

The test suite validates:
- Standard arithmetic calculations (`+`, `-`, `*`, `/`)
- Safe decimal precision (`0.1 + 0.2`)
- Division by zero error handling
- Malformed syntax protection
- Django index view GET and POST handling
- Backend JSON API `/api/calculate/`

---

## 🔌 API Reference

### Calculate Endpoint
- **URL**: `/api/calculate/`
- **Method**: `POST` (or `GET`)
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "expression": "12 * 8 + 4"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "expression": "12 * 8 + 4",
    "result": "100"
  }
  ```

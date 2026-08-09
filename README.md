# Prescripto 🩺

Prescripto is a full-stack doctor appointment booking application where users can browse doctors, book appointments, and manage their profiles.  
It also includes an admin panel to manage doctors and appointments.

This project was built as a learning-focused full-stack application using modern web technologies.

---

## 🚀 Live Demo

- **Frontend:** (Add Vercel URL)
- **Admin Panel:** (Add Vercel URL)
- **Backend API:** (Add Render URL)

---

## 🛠 Tech Stack

### Frontend & Admin
- React (Vite)
- Tailwind CSS
- React Router
- Axios
- Context API

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt

### Cloud & Hosting
- MongoDB Atlas (Database)
- Cloudinary (Image Storage)
- Vercel (Frontend & Admin Hosting)
- Render (Backend Hosting)

---

## ✨ Features

### User
- User registration & login (JWT based authentication)
- Browse doctors
- Book doctor appointments
- View profile details
- Secure routes using authentication middleware
- Book, cancel appointments
- Secure online payments using Razorpay

### Admin
- Admin login
- Add & manage doctors
- View all appointments
- Upload doctor images (Cloudinary)
- Manage appointments including cancellations
- View payment-related appointment details

---

## 📂 Project Structure

```
prescripto/
├─ frontend/ # User-facing React app
├─ admin/ # Admin dashboard (React)
└─ backend/ # Node.js + Express API
```

---

## 🔐 Environment Variables

Each part of the project uses environment variables which are **not committed to GitHub**.

## ▶️ Running the Project Locally
1️⃣ Clone the repository
git clone https://github.com/your-username/prescripto.git

2️⃣ Install dependencies
### Frontend
```
cd frontend
npm install
npm run dev
```

### Admin
```
cd admin
npm install
npm run dev
```

### Backend
```
cd backend
npm install
npm run server
```

## 📚 What I Learned From This Project

- Building a full-stack application from scratch

- JWT authentication & protected routes

- Context API for global state management

- API communication using Axios

- Hosting frontend & backend separately

- Handling environment variables securely

- Working with MongoDB Atlas & Cloudinary

## 📌 Future Improvements

- Appointment rescheduling

- Email notifications

- Better role-based access control

- Improved UI/UX

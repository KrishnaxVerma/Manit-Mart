# MANIT Mart

**MANIT Mart** is a MERN-based online marketplace designed specifically for college students to buy and sell products within their campus community. The application offers a smooth and secure user experience with features like authentication, profile management, dark mode, and product listing filters.

---

## 🔗 Live Demo

- 🌐 [Live Website](https://manit-mart-frontend.onrender.com/)
- 💻 [GitHub Repository](https://github.com/KrishnaxVerma/Manit-Mart)

---

## ⚙️ Tech Stack

| Technology     | Description                                  |
|----------------|----------------------------------------------|
| MongoDB        | NoSQL Database for storing user/product data |
| Express.js     | Backend web framework                        |
| React.js       | Frontend library for building UI             |
| Node.js        | JavaScript runtime for the backend           |
| bcrypt.js      | Password hashing and authentication          |
| Tailwind CSS   | Utility-first CSS framework                  |

---

## ✨ Features

- 🔐 **User Authentication**  
  - Secure password storage using `bcrypt.js`  

- 👤 **Profile Management**  
  - Users can update personal information  
  - View and manage their listed products  

- 🛒 **Product Listings**  
  - Post, update, and delete product listings  
  - View listings from other users  
  - **Filter products by category** for easier browsing  

- 🌙 **Dark Mode Support**  
  - Toggle between light and dark themes for better accessibility  

---

## 🗂️ Folder Structure

```
Manit-Mart/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── tailwind.config.js
├── backend/                # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- MongoDB Atlas account or local MongoDB instance

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/KrishnaxVerma/Manit-Mart.git
   cd Manit-Mart
   ```

2. **Set up the backend:**

   ```bash
   cd backend
   npm install
   touch .env
   ```

   Inside `.env`:

   ```env
   MONGO_URI=your_mongodb_connection_string
   ```

   Start the backend server:

   ```bash
   npm start
   ```

3. **Set up the frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open the app at:  
   [http://localhost:5173](http://localhost:5173)

---

## 🧠 Future Enhancements

- Chat app integration planned for direct messaging between users
- Payment gateway integration
- Admin dashboard for user and listing management

---

## 🤝 Connect with Me

- [LinkedIn](https://www.linkedin.com/in/krishnaxverma/)
- [GitHub](https://github.com/KrishnaxVerma)
- [Email](mailto:kv7477000@gmail.com)

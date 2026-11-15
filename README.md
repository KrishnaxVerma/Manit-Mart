# 🛒 MANIT Mart

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.8-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**MANIT Mart** is a modern, full-featured peer-to-peer campus marketplace designed exclusively for students of **MANIT Bhopal** (Maulana Azad National Institute of Technology). It allows verified campus students to buy, sell, exchange, and discover items such as textbooks, electronics, cycles, hostel essentials, stationery, and academic equipment safely within their college community.

---

## 🔗 Links & Live Demo

- 🌐 **Live Website**: [manit-mart-frontend.onrender.com](https://manit-mart-frontend.onrender.com/)
- 💻 **GitHub Repository**: [KrishnaxVerma/Manit-Mart](https://github.com/KrishnaxVerma/Manit-Mart)

---

## ✨ Key Features

- 🔐 **Campus-Restricted Authentication & Security**
  - Registration and login are restricted to student institutional emails (`@stu.manit.ac.in`).
  - Firebase Authentication with mandatory email verification before accessing marketplace features (`/buy`, `/sell`, `/messages`, `/account`).
  - Secure password reset flow (`/reset-password`).

- 💬 **In-App Real-Time Messaging & Chat**
  - Direct buyer-seller peer-to-peer chat powered by Firestore real-time listeners.
  - Dedicated inbox (`/messages`) and contextual item negotiation modal (`ChatModal`).
  - Eliminates the need to share personal contact numbers or rely solely on external emails.

- 💳 **Integrated UPI Payments & OTP Verification**
  - Instant on-screen UPI QR Code generation via `qrcode.react`.
  - One-click UPI Intent deep-linking for mobile devices (GPay, PhonePe, Paytm).
  - Secure handover verification with buyer-seller OTP confirmation modal (`VerifyOtpModal`).

- 📦 **Comprehensive Product Listings**
  - Sell items with title, detailed description, condition, category, and pricing.
  - Multi-image upload (up to 5 high-resolution images) powered by **Cloudinary**.
  - Automatic client-side and CDN image optimization, thumbnail generation, and responsive previews.
  - Easy edit, mark-as-sold, and listing deletion directly from the seller dashboard.

- 🔍 **Advanced Filtering, Sorting & Search**
  - Search listings dynamically by keywords and titles.
  - Categorical filters (Books, Electronics, Cycles, Stationery, Hostel Essentials, etc.).
  - Condition filters (Brand New, Like New, Good, Fair) and custom price range selectors.
  - Paginated, incremental lazy loading for maximum responsiveness.

- ❤️ **Wishlist & Saved Items**
  - One-click save/bookmark items for quick access later (`WishlistContext`).
  - Synchronized wishlist view in the user's account dashboard.

- 👤 **Unified Student Account Dashboard**
  - Manage student profile (Hostel, Name, Branch, UPI ID for receiving payments).
  - Track active listings, review saved items, and view order/transaction history.

- 🌓 **Dark Mode & Responsive UI**
  - Fully responsive, mobile-first design built with Tailwind CSS and DaisyUI.
  - Smooth light/dark theme switcher with persistent preference saved in `localStorage`.

- 📬 **Integrated Contact Desk**
  - Contact and feedback form integrated with **Web3Forms**.

---

## ⚙️ Tech Stack

| Domain | Technology / Library | Description |
|---|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) | Modern component-based SPA UI |
| **Build Tooling** | [Vite 5](https://vitejs.dev/) | Lightning-fast HMR and bundling |
| **Styling & Components**| [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) | Responsive design & semantic UI components |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) | Email/password auth, `@stu.manit.ac.in` domain lock |
| **Database** | [Cloud Firestore](https://firebase.google.com/products/firestore) | Real-time database for products, users, chats, & orders |
| **Image Hosting** | [Cloudinary](https://cloudinary.com/) | Multi-image cloud storage, CDN delivery, and optimization |
| **Payments & QR** | [qrcode.react](https://github.com/zpao/qrcode.react) | Dynamic UPI QR code generation & deep links |
| **Routing** | [React Router DOM v6](https://reactrouter.com/) | Client-side declarative routing and protected routes |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) | Lightweight and customizable toast alerts |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) | Efficient, performant form validations |
| **Carousels & Sliders**| [React Slick](https://react-slick.neostack.com/) | Interactive image showcases on product cards |
| **Contact Form** | [Web3Forms](https://web3forms.com/) | Serverless contact form delivery |
| **Deployment** | [Firebase Hosting](https://firebase.google.com/products/hosting) / [Render](https://render.com/) | Fast global static site delivery |

---

## 🗂️ Project Directory Structure

```
Manit-Mart/
├── public/                     # Static assets (favicons, logos)
│   └── collegelogo.png
├── src/
│   ├── components/             # Reusable UI & core page components
│   │   ├── chat/               # Chat-related modals & payment components
│   │   │   ├── PaymentModal.jsx      # UPI QR code & transaction generator
│   │   │   └── VerifyOtpModal.jsx    # Delivery verification OTP dialog
│   │   ├── Account.jsx         # User dashboard (Profile, Listings, Wishlist)
│   │   ├── Banner.jsx          # Hero banner with statistics
│   │   ├── BookCard.jsx        # Product display card with image carousel
│   │   ├── Buy.jsx             # Marketplace feed with search & filters
│   │   ├── ChatModal.jsx       # Direct chat modal component
│   │   ├── Contact.jsx         # Web3Forms contact page
│   │   ├── Footer.jsx          # Application footer
│   │   ├── Layout.jsx          # Shared page wrapper
│   │   ├── Login.jsx           # Student login screen
│   │   ├── Messages.jsx        # In-app conversations & chat inbox
│   │   ├── Navbar.jsx          # Navigation header with dark mode toggle
│   │   ├── Profile.jsx         # Profile view / editor
│   │   ├── Sell.jsx            # Listing creation & Cloudinary multi-upload
│   │   ├── Signup.jsx          # Student registration with domain filter
│   │   ├── VerificationPending.jsx # Unverified email gatekeeper view
│   │   ├── WishlistButton.jsx  # Toggle button for saving items
│   │   └── WishlistPage.jsx    # Dedicated wishlist screen
│   ├── context/
│   │   └── WishlistContext.jsx # Wishlist state provider & persistence
│   ├── Home/
│   │   └── Home.jsx            # Landing page wrapper
│   ├── pages/
│   │   ├── OrdersHistory.jsx   # Detailed order and transaction records
│   │   └── ResetPassword.jsx   # Password reset screen
│   ├── utils/
│   │   ├── cloudinaryConfig.js # Cloudinary environment configuration
│   │   ├── imageUpload.js      # Unsigned upload pipeline with error checks
│   │   └── productImages.js    # Multi-format product image normalizer
│   ├── App.jsx                 # Route definitions & auth gating
│   ├── firebase.js             # Firebase service initialization
│   ├── index.css               # Global Tailwind CSS definitions
│   └── main.jsx                # Application root entry point
├── .env.example                # Sample environment variables
├── CLOUDINARY_SETUP.md         # Detailed guide for Cloudinary setup
├── firebase.json               # Firebase Hosting & Firestore configuration
├── firestore.indexes.json      # Firestore composite indexes definition
├── firestore.rules             # Firestore security rules
├── package.json                # Project dependencies and npm scripts
├── tailwind.config.js          # Tailwind CSS and DaisyUI configuration
└── vite.config.js              # Vite configuration
```

---

## 🚀 Getting Started

Follow these instructions to set up and run MANIT Mart locally.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- `npm` (bundled with Node.js)
- A [Firebase](https://console.firebase.google.com/) account
- A [Cloudinary](https://cloudinary.com/) account (free tier works great)
- A [Web3Forms](https://web3forms.com/) Access Key (for the contact page)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/KrishnaxVerma/Manit-Mart.git
cd Manit-Mart
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and provide your credentials:

```env
# Contact Form (Web3Forms)
VITE_ACCESS_KEY=your_web3forms_access_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Image Hosting
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=manit_mart_products
VITE_CLOUDINARY_FOLDER=manit_mart/products

```

> 📖 **Cloudinary Setup Note**: For step-by-step guidance on setting up an **Unsigned Upload Preset** (`manit_mart_products`), refer to [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md).

### Step 4: Firebase Configuration

1. **Enable Authentication**: In the Firebase Console, go to **Authentication** > **Sign-in method** and enable **Email/Password**.
2. **Enable Cloud Firestore**: Create a Firestore Database in production mode in your preferred region (e.g. `asia-south1`).
3. **Deploy Security Rules & Indexes**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use your_project_id
   firebase deploy --only firestore
   ```

### Step 5: Start the Development Server

```bash
npm run dev
```

Visit the application in your browser:
👉 [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Available Scripts

In the project directory, you can run:

| Command | Description |
|---|---|
| `npm run dev` | Launches the local development server with Vite HMR |
| `npm run build` | Builds the production bundle to the `dist` directory |
| `npm run preview` | Locally previews the production build output |
| `npm run lint` | Runs ESLint to check for code standard violations |

---

## 🔒 Security & Campus Privacy

- **Domain Restriction**: Only emails ending in `@stu.manit.ac.in` can create accounts, preventing unauthorized external access.
- **Verification Gate**: Users must verify their email address before accessing product listings, publishing items, or sending messages.
- **Handshake Expiry**: Each buyer chat has its own five-minute handover OTP. OTPs do not reserve or hide the listing, and buyers can generate a fresh code in their chat.
- **Cloudinary Safe Uploads**: Client uploads are validated for file size (max 5 MB) and MIME types before dispatching to Cloudinary.
- **Firestore Rules**: Granular Firestore security rules (`firestore.rules`) govern access controls to products, users, conversations, and transaction records.

---

## 🔮 Roadmap & Future Enhancements

- [x] In-app real-time messaging between buyers and sellers
- [x] UPI QR code generation and OTP verification modal
- [x] Multi-image Cloudinary uploads with auto-optimization
- [x] Wishlist and saved items tracking
- [ ] Push notifications for new messages and price drops (Firebase Cloud Messaging)
- [ ] Automated image content moderation
- [ ] Mobile application using React Native / Flutter
- [ ] AI-powered smart price estimation based on historical campus deals

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Krishna Verma**
- 💼 **LinkedIn**: [krishnaxverma](https://www.linkedin.com/in/krishnaxverma/)
- 🐙 **GitHub**: [@KrishnaxVerma](https://github.com/KrishnaxVerma)
- 📧 **Email**: [kv7477000@gmail.com](mailto:kv7477000@gmail.com)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

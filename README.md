# SpeedNation - Car Events & Community Platform

Welcome to **SpeedNation**! This project is a web and mobile application designed for car enthusiasts to discover car meets, share photos, manage events, and interact within a passionate automotive community.

I developed this application as part of my **Bachelor 3 in AI & Data Science**. The main goal was to build a complete full-stack project while applying modern web/mobile technologies, cloud backend services, and clean database integration.

---

## 📌 Features

- **User Authentication**: Secure sign-up, login, and profile management (powered by Supabase Auth).
- **Event Discovery & Creation**: Browse upcoming car meets, view details on interactive views, and publish your own events.
- **Media Gallery & Upload**: Upload car photos directly from your device using mobile/web file pickers.
- **Real-time Data & Storage**: Instant updates for comments, likes, and event registrations using PostgreSQL & Supabase buckets.
- **Responsive & Modern UI**: Sleek dark mode design optimized for both web browsers and mobile devices.

---

## 🛠️ Tech Stack & Architecture

### **Frontend & Mobile**
- **React Native / Expo (SDK 54)**: Cross-platform mobile development (iOS, Android, and Web).
- **React Navigation v7**: Fluid tab and stack navigation between screens.
- **Vanilla CSS / Custom Styling**: Modern visual design with blur effects and gradients.

### **Backend & Database**
- **Supabase**: Backend-as-a-Service providing PostgreSQL, Auth, and Cloud Storage.
- **Node.js Express / Docker**: Optional server deployment configuration with Nginx proxy for production setup.

### **Data & AI Perspectives**
*(As a B3 Data & AI student, future roadmap inclusions for this platform)*:
- **Computer Vision**: Automated car brand/model identification using image recognition models (YOLO / OpenCV).
- **Recommendation Engine**: Event suggestions based on user preferences and location history.

---

## 🚀 Getting Started

Follow these instructions to run the project on your local machine.

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go app](https://expo.dev/go) on your phone (if you want to test on mobile)

### **Installation**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/SpeedNation.git
   cd SpeedNation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root folder and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start the application**:
   ```bash
   npm run start
   ```
   - Press `w` to open in the web browser.
   - Scan the QR code with **Expo Go** to open on iOS/Android.

---

## 🐳 Docker Deployment (Optional)

If you want to run the project using Docker:

```bash
docker-compose up --build
```

This launches the web bundle served through Nginx.

---

## 📝 What I Learned

Building this project helped me strengthen several key skills:
- Understanding cross-platform development challenges with Expo and React Native.
- Managing database security rules (Row Level Security - RLS) in PostgreSQL via Supabase.
- Structuring a clean front-end application with reusable components and proper navigation state.
- Documenting technical workflows in English to demonstrate software engineering and data integration capabilities.

---

## 👤 Author

**Quentin**  
*Student in Bachelor 3 - Artificial Intelligence & Data Science*  
- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [Your Profile](https://linkedin.com)

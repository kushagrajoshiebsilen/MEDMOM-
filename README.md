<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛡️ MedMom Care Companion
**The AI-Powered Guardian for Your Loved Ones**

MedMom is a premium, real-time healthcare monitoring application designed to ensure medication adherence and peace of mind for families. Using Gemini 1.5 Flash AI, it decodes complex medical reports and provides a seamless communication bridge between caregivers and family members.

## ✨ Key Features
- **AI Medication Verification:** Verify doses via photo with Gemini AI.
- **AI Health Report Decoder:** Upload blood reports; Gemini explains them in simple words.
- **Real-Time Calling:** One-tap calling with high-priority speaker auto-answer.
- **Family Dashboard:** Caregivers can view real-time adherence stats for loved ones.
- **Smart Notifications:** Send reminders that pop up instantly on family devices.
- **Contextual Alarms:** "College Mode" for quiet, persistent notifications vs. loud alarms.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gemini API Key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment:
   Create a `.env` file based on `.env.example`:
   ```env
   MONGODB_URI=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Running Locally
```bash
npm run dev
```

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express, Mongoose.
- **AI:** Google Gemini 1.5 Flash.
- **Deployment:** Vercel.

---
*Built with ❤️ for better care.*

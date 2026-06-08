# MoodMeld 2.0: AI-Powered Emotional Wellness Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115.0-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-GPT_4o_Mini-412991?style=for-the-badge&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

<br/>

MoodMeld is a full-stack, AI-driven mental wellness application designed to serve as an empathetic, real-time conversational companion. By leveraging natural language processing (NLP) and advanced acoustic voice analysis, MoodMeld accurately detects emotional states, tracks long-term mood trends, and provides personalized, actionable recommendations to improve user well-being.

---

## 🎯 The Problem
Mental health resources are often expensive, inaccessible, or lack immediate availability. Individuals struggling with stress, burnout, or anxiety need a safe, judgment-free space to express themselves and receive instant, constructive feedback. Existing journaling apps rely heavily on manual entry and fail to capture the nuanced emotional markers present in human speech and conversation.

## 💡 Business Value
MoodMeld bridges the gap between passive journaling and active therapy by providing:
- **Instant Empathy & Support:** A 24/7 conversational AI that listens and responds to emotional distress.
- **Data-Driven Insights:** Automated tracking of emotional trends over time, helping users identify triggers.
- **Clinical Readiness:** The ability to generate comprehensive PDF reports summarizing behavioral scores and mood analytics, which can be shared directly with licensed therapists or healthcare providers.
- **High User Engagement:** Voice-first interaction reduces friction, making it easier for users to log their feelings naturally.

---

## 🏗️ Technical Architecture

The application is built on a decoupled **client-server architecture**, utilizing Next.js for a highly responsive, SSR-capable frontend and FastAPI for a high-performance, asynchronous Python backend tailored for machine learning workloads.

```text
+-------------------------------------------------------------+
|                        CLIENT TIER                          |
|  +-------------------+               +-------------------+  |
|  |   Next.js (App)   | <--- HTTPS ---|  Browser Web API  |  |
|  |  React, Tailwind  |   WebSockets  | (Mic, AudioBlob)  |  |
|  +-------------------+               +-------------------+  |
+-----------+------------------------------------+------------+
            |                                    |
       REST API (JSON)                    Audio Stream (WebM)
            |                                    |
+-----------v------------------------------------v------------+
|                       APPLICATION TIER                      |
|                      (FastAPI / Python)                     |
|                                                             |
|  [ Auth & JWT ]   [ API Routers ]   [ Background Tasks ]    |
|                                                             |
|  +-------------------+               +-------------------+  |
|  |   NLP Service     |               |   Audio Service   |  |
|  | (OpenAI / VADER)  |               | (Librosa / Numpy) |  |
|  +-------------------+               +-------------------+  |
|            |                                   |            |
|            +---------+               +---------+            |
|                      |               |                      |
|                  [ Feature Extraction & ]                   |
|                  [ Emotion Circumplex   ]                   |
+--------------------------+----------------------------------+
                           |
                     Asyncio / Motor
                           |
+--------------------------v----------------------------------+
|                         DATA TIER                           |
|                  [ MongoDB Atlas Cloud ]                    |
|    (Users, Conversations, Activities, Mood Analytics)       |
+-------------------------------------------------------------+
```

---

## 🚀 Key Features & Implementation Modules

### 1. Multi-Modal Conversational AI
- **Text & Voice Input:** Users can interact via standard text or record audio directly in the browser using the `MediaRecorder` API.
- **Acoustic Emotion Recognition:** When voice is submitted, the backend uses `librosa` to extract 13 MFCCs, pitch (F0 via pyin), RMS energy, and spectral features. These are mapped against Russell's Arousal-Valence Circumplex model to accurately detect micro-expressions of stress, burnout, or calmness in the user's voice.
- **Context-Aware Responses:** Integrates with OpenAI's GPT-4o-mini to generate empathetic, contextually relevant responses based on the detected emotional state and previous conversation history.

### 2. Mood & Behavioral Analytics
- **Continuous Tracking:** VADER sentiment analysis runs on all text inputs, logging continuous valence scores.
- **Predictive Trends:** The dashboard utilizes `Recharts` to visualize 7-day and 30-day emotional trajectories, providing actionable insights into mood volatility.

### 3. Automated Activity Recommendations
- **Smart Suggestions:** Based on the current detected emotion (e.g., high arousal, negative valence = anxiety), the system recommends specific activities (e.g., 4-7-8 breathing, light stretching).
- **Auto-Logging:** The AI can detect when a user mentions completing an activity during conversation and automatically log it to their profile.

### 4. Clinical PDF Report Generation
- **Exportable Health Summaries:** Using `ReportLab`, the backend compiles a professional, paginated PDF report containing demographic data, behavioral scores, dominant emotions, and a timeline of logged activities for easy sharing with medical professionals.

---

## 📸 Application Screenshots

| Dashboard Analytics | Voice Conversational UI |
| :---: | :---: |
| *[Replace with Image]* | *[Replace with Image]* |
| **Activity Recommendations** | **Clinical PDF Report** |
| *[Replace with Image]* | *[Replace with Image]* |

---

## ⚙️ Installation & Workflow

### Prerequisites
- Node.js 18+
- Python 3.12+
- MongoDB Atlas Account
- OpenAI API Key

### Backend Setup (FastAPI)
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT_SECRET_KEY, and OPENAI_API_KEY

# 5. Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (Next.js)
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file and add:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 4. Run the development server
npm run dev
```

---

## 📈 Results & Impact
- **Performance:** Asynchronous data fetching via Motor (MongoDB) and decoupled heavy ML tasks ensure API response times consistently under 300ms for text interactions.
- **Scalability:** The containerized approach and separation of ML dependencies (making them optional for minimal cloud instances) allows for seamless deployment on serverless architectures like Vercel and cost-effective hosting platforms like Render.
- **Resilience:** Implemented robust error handling and gracefully degrading fallbacks; if system-level audio libraries (`libsndfile`) are missing in production environments, the app bypasses acoustic analysis and relies purely on NLP without crashing.

---
*This project was developed to showcase advanced integration of full-stack web development, real-time machine learning, and human-centric UI/UX design.*

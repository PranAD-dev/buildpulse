# BuildPulse 

**AI-powered construction progress tracking that turns weeks of delays into actionable insights.**

> 🏆 **Winner: Best Use of MongoDB** — CruzHacks 2025

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](#)
[![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?logo=google&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)](#)

---

## The Problem

98% of construction projects face delays, costing the industry **$1.6 trillion annually**. Most contractors still track progress with clipboards and spreadsheets—manual processes that take 2+ hours per assessment and catch problems too late to fix.

## The Solution

BuildPulse lets users upload 3D building models, assign trackable zones with a click, and snap daily progress photos. Our AI compares photos against the 3D model and instantly identifies what's complete vs. missing—turning a 2+ hour manual process into **under 5 seconds**.

---

## Features

- **3D Model Upload** — Support for .glb/.gltf files up to 50MB via MongoDB GridFS
- **Interactive Zone Assignment** — Click directly on your 3D model to define trackable areas (roof, walls, foundation, etc.)
- **AI Progress Analysis** — Gemini 2.0 Flash compares site photos against 3D renders to estimate completion percentage
- **Delay Prediction** — Velocity-based forecasting warns you about potential deadline misses weeks in advance
- **Stakeholder Reports** — One-click AI-generated video updates via OpenNote SDK

---

## Demo

![BuildPulse Demo](demo.gif)

1. Upload your target 3D model
2. Click to assign zones (kitchen, roof, exterior walls...)
3. Snap a daily progress photo
4. AI returns: *"Kitchen: 67% complete. Predicted delay: 8 days."*

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, React, Tailwind CSS, Radix UI |
| **3D Rendering** | Three.js, React Three Fiber |
| **Backend** | Next.js API Routes, Mongoose |
| **Database** | MongoDB Atlas + GridFS |
| **AI/ML** | Google Gemini 2.0 Flash |
| **Auth** | Auth0 |
| **Video Generation** | OpenNote SDK |
| **Charts** | Recharts |
| **Deployment** | Vercel |

---

## Technical Highlights

### MongoDB GridFS for Large 3D Models

3D building models are often 10-50MB+. We initially hit file size limits with other solutions. GridFS solved this by automatically chunking large files and storing them directly in MongoDB—seamless integration with our existing Mongoose setup.

```javascript
// Storing a 3D model with GridFS
const bucket = new mongoose.mongo.GridFSBucket(db);
const uploadStream = bucket.openUploadStream(filename);
fileBuffer.pipe(uploadStream);
```

### Gemini Vision for Spatial Understanding

The hardest challenge: getting AI to understand the relationship between 2D construction photos and 3D architectural models. Gemini correctly identifies building components (roof, walls, foundation) from mesh geometry and compares them against messy real-world job site photos.

```javascript
const analysis = await gemini.generateContent([
  { inlineData: { mimeType: "image/jpeg", data: sitePhotoBase64 } },
  { inlineData: { mimeType: "image/png", data: modelRenderBase64 } },
  { text: "Compare the construction progress. Identify completed vs missing components." }
]);
```

### React Three Fiber for Interactive 3D

Custom raycasting enables click-to-select zone assignment directly on the 3D model. Users can click a mesh, name it "Kitchen," and that zone becomes trackable across all future progress photos.

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google AI Studio API key (Gemini)
- Auth0 application
- OpenNote API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/buildpulse.git
cd buildpulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
MONGODB_URI=mongodb+srv://...
GOOGLE_AI_API_KEY=your_gemini_key
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
OPENNOTE_API_KEY=your_opennote_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js + React Three Fiber + Tailwind                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Routes                               │
│  /api/projects  /api/upload  /api/analyze  /api/report      │
└───────┬─────────────┬─────────────┬─────────────┬───────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ MongoDB │   │ GridFS  │   │ Gemini  │   │OpenNote │
   │  Atlas  │   │(Models) │   │   AI    │   │   SDK   │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

---

## Roadmap

- [ ] 📱 Mobile app for on-site photo capture with offline support
- [ ] 📊 Multi-project dashboards for construction firms
- [ ] 🚁 Drone footage analysis for large-scale site monitoring
- [ ] 🌱 Carbon footprint tracking and sustainability reports
- [ ] 🤝 Contractor marketplace for delayed projects

---

## Team

Built in 36 hours at [CruzHacks 2025](https://www.cruzhacks.com/)

---

## License

MIT License — see [LICENSE](LICENSE) for details

---

## Links

- [Devpost](https://devpost.com/software/buildpulse-ai)
- [Live Demo](https://buildpulse.vercel.app)

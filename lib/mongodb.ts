import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Project Schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  reference_type: { type: String, enum: ['images', '3d_model'], required: true },
  model_url: { type: String }, // Can store large base64 strings
  target_completion_date: { type: Date },
  overall_progress: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  report_video_id: { type: String },
  report_video_url: { type: String },
  progress_history: [
    {
      date: { type: Date, required: true },
      progress: { type: Number, required: true },
    },
  ],
  created_at: { type: Date, default: Date.now },
})

// Room Schema
const RoomSchema = new mongoose.Schema({
  project_id: { type: String, required: true },
  name: { type: String, required: true },
  reference_image_url: { type: String }, // Can store large base64 strings
  model_camera_position: { type: Object },
  mesh_assignments: [{ type: String }], // Store mesh UUIDs assigned to this room
  current_percent: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
})

// Progress Entry Schema
const ProgressEntrySchema = new mongoose.Schema({
  room_id: { type: String, required: true },
  photo_url: { type: String, required: true },
  ai_estimated_percent: { type: Number },
  ai_confidence: { type: String, enum: ['high', 'medium', 'low'] },
  visible_completed: [String],
  still_missing: [String],
  notes: { type: String },
  captured_at: { type: Date, default: Date.now },
})

// Export models (use existing models if already compiled)
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)
export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema)
export const ProgressEntry =
  mongoose.models.ProgressEntry || mongoose.model('ProgressEntry', ProgressEntrySchema)

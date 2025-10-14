// models/Book.js
import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, unique: true },
    authors: [{ type: String }],
    isbn: { type: String, index: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    mrp: { type: Number }, // optional
    discountPercent: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    category: { type: String },
    language: { type: String },
    coverImage: { type: String }, // Cloudinary URL or path
    pdfPreview: { type: String }, // optional cloudinary/pdf URL
    stock: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Avoid model overwrite issue in dev with hot reload:
export default mongoose.models.Book || mongoose.model('Book', BookSchema);

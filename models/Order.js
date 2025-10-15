// models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // our DB id or razorpay order id
    razorpayOrderId: { type: String }, // from Razorpay when created
    razorpayPaymentId: { type: String }, // set after payment success
    razorpaySignature: { type: String }, // signature from Razorpay
    amount: { type: Number, required: true }, // amount in paise (integer)
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'created' }, // created, paid, failed
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    items: [
      {
        bookId: String,
        slug: String,
        title: String,
        qty: Number,
        price: Number // per unit in rupees
      }
    ],
    metadata: Object
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

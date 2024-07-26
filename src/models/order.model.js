import mongoose, {Schema} from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  validity:{type:Number,required:true},
  validUpto:{type:Date,required:true},
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String }, 
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalQuantity: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

OrderSchema.pre('save', function (next) {
  this.totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  // this.updatedAt = Date.now();
  // const currentDate = new Date();
  // this.items.forEach(item => {
  //   item.validUpto = new Date(currentDate.setDate(currentDate.getDate() + item.validity)) || Date.now;
  // });
  next();
});

export const Order = mongoose.model('Order', OrderSchema);

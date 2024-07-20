import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";


const addToCart = asyncHandler( async (req, res) => {
    const userId =req.user._id;
    const {  productId, quantity } = req.body;
    if([productId,quantity].some((field)=>{
        return field===""||field===undefined
      })){
      return res.status(400).json(new ApiResponse(400,{},"Some fields are empty!!",false))
      }
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json(new ApiResponse(404,{},"Product not found !!",false));
      }
  
      // Find the user's cart
      let cart = await Cart.findOne({ userid:req.user._id });
  
      if (cart) {
        // Check if the product already exists in the cart
        const existingItemIndex = cart.items.findIndex(item => item.productId.equals(productId));
  
        if (existingItemIndex > -1) {
          // If the product exists, update its quantity
          cart.items[existingItemIndex].quantity += quantity;
        } else {
          // If the product does not exist, add it to the cart
          cart.items.push({
            productId: product._id,
            productName: product.productName,
            price: product.price,
            quantity,
            image: product.images[0], // Assuming the first image in the array
            sellerId: product.seller,
          });
        }
      } else {
        // If the cart does not exist, create a new cart
        cart = new Cart({
          userId,
          items: [{
            productId: product._id,
            productName: product.productName,
            price: product.price,
            quantity,
            image: product.images[0], // Assuming the first image in the array
            sellerId: product.seller,
          }],
        });
      }
  
      // Save the cart
      await cart.save();
      return res.status(201).json(new ApiResponse(201,cart,"Added to cart successfully !!",true));
     
  }
)

const getCart = asyncHandler(async (req, res) => {
    userId = req.user._id;

      // Find the user's cart
      const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName price images');
      if (!cart) {
        return res.status(404).json(new ApiResponse(404,{},"Cart seems to be empty !!"));
      }
      res.status(200).json(new ApiResponse(200, cart , "Cart fetched successfully !!"));
})

const createOrder = asyncHandler(async (req, res) => {
    const {  items } = req.body;
    const userId = req.user._id;
      const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
      const newOrder = new Order({
        userId,
        items,
        totalPrice: totalAmount,
        paymentStatus: 'pending',
      });
  
      await newOrder.save();
  
      res.status(200).json(new ApiResponse(200,newOrder,"Order placed successfully !!"));
   
  })
  

  const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
      const order = await Order.findById(orderId).populate('items.productId', 'productName price images');
      if (!order) {
        return res.status(404).json(new ApiResponse(404,{},"Cannot find order with given ID !!"));
      }
      res.status(200).json(new ApiResponse(200,order,"Order fetched successfully !!"));
  })
  

  const getOrdersByUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    
      const orders = await Order.find({ userId }).populate('items.productId', 'productName price images');
  
      if (!orders) {
        return res.status(404).json(new ApiResponse(404,{},"Order not found for the provided user ID !!"));
      }
  
      res.status(200).json(new ApiResponse(200,orders,"Order fetched successfully !!"));
    
  })


  const getOrdersBySeller = asyncHandler(async (req, res) => {
    const sellerId=req.user._id;
      const orders = await Order.find({ 'items.sellerId': sellerId })
        .populate('items.productId', 'productName price images')
        .populate('userId', 'username email');
  
      if (!orders || orders.length === 0) {
        return res.status(404).json(new ApiResponse(404,{},"No orders found for this seller"));
      }
  
      res.status(200).json(new ApiResponse(200,orders,"Orders fetched successfully !!"));
  })



  const getOrderStatisticsBySeller = asyncHandler( async (req, res) => {
    const sellerId = req.user._id;
      const statistics = await Order.aggregate([
        { $unwind: '$items' },
        { $match: {'items.sellerId': mongoose.Types.ObjectId(sellerId)}},
        {
          $group: {
            _id: {
              year: {$year: '$createdAt'},
              month: {$month: '$createdAt'},
              day: {$dayOfMonth: '$createdAt'},
            },
            totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);
  
      if (!statistics || statistics.length === 0) {
        return res.status(404).json(new ApiResponse(404,{},'No order statistics found for this seller !!'));
      }
  
      res.status(200).json(new ApiResponse(200, statistics ,"Statistics fetched successfully !!"));
    
  })
  

  export {addToCart,getCart,createOrder,getOrderById,getOrdersByUser,getOrdersBySeller,getOrderStatisticsBySeller}
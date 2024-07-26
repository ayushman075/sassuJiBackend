import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { razorpayInstance } from "../db/razorpay.config.js";
import crypto from "crypto";


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
      let cart = await Cart.findOne({ userId:userId});
  
      if (cart) {
        // Check if the product already exists in the cart
        const existingItemIndex = cart.items.findIndex(item => item.productId.equals(productId));
  
        if (existingItemIndex > -1) {
          // If the product exists, update its quantity
          cart.items[existingItemIndex].quantity += quantity;
          if(cart.items[existingItemIndex].quantity<=0){
            cart.items.splice(existingItemIndex,1);
          }
        } else {
          // If the product does not exist, add it to the cart
          cart.items.push({
            productId: product._id,
            productName: product.productName,
            price: product.price,
            quantity,
            validity:product.validity,
            image: product.images[0],
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
            validity:product.validity,
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
   const userId = req.user._id;

      // Find the user's cart
      const cart = await Cart.findOne({ userId }).populate('items.productId', 'productName price images');
      if (!cart) {
        return res.status(404).json(new ApiResponse(404,{},"Cart seems to be empty !!"));
      }
      res.status(200).json(new ApiResponse(200, cart , "Cart fetched successfully !!"));
})



const createOrder = asyncHandler(async (req, res) => {
    const {  items } = req.body;
    if(!items){
      return res.status(501).json(new ApiResponse(501,{},"Order cann't be placed for empty cart !!"));
    }
    const userId = req.user._id;
      const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
      items.forEach(item => {
        item.validUpto = new Date(new Date().setDate(new Date().getDate() + item.validity));
      });
      const options = {
        amount :totalAmount*100,
        currency:"INR",
        receipt:`order_rcptid_11`
      }
      const newOrder = new Order({
        userId,
        items,
        totalPrice: totalAmount,
        paymentStatus: 'pending',
      });
  
      await newOrder.save();

      try {
        razorpayInstance.orders.create(options,function(err,order){
          if(err){
            console.log(err)
            return res.status(501).json(new ApiResponse(501,err,"Error creating order on Payment Gateway !!"));
            
          }
          
          res.status(200).json(new ApiResponse(200,{newOrder,order},"Order placed successfully !!"));

        })
      } catch (error) {
              return res.status(501).json(new ApiResponse(501,{},"Error creating order on Payment Gateway !!"));
      }
  
   
  })
  

  const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.query;
    if(!orderId){
      return res.status(402).json(new ApiResponse(402,{},"OrderID is required"));

    }
      const order = await Order.findById(orderId).populate('items.productId', 'productName price images');
      if (!order) {
        return res.status(404).json(new ApiResponse(404,{},"Cannot find order with given ID !!"));
      }
      res.status(200).json(new ApiResponse(200,order,"Order fetched successfully !!"));
  })
  

  const getOrdersByUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    if(!userId){
      return res.status(402).json(new ApiResponse(402,{},"Must login to access this functionality !!"));
    }
      const orders = await Order.find({ userId }).populate('items.productId', 'productName price images');
  
      if (!orders) {
        return res.status(404).json(new ApiResponse(404,{},"Order not found for the provided user ID !!"));
      }
  
      res.status(200).json(new ApiResponse(200,orders,"Order fetched successfully !!"));
    
  })


  const getOrdersBySeller = asyncHandler(async (req, res) => {
    const sellerId=req.user._id;
    if(!sellerId){
      return res.status(402).json(new ApiResponse(402,{},"Must login to access this functionality !!"));
    }

    const orders = await Order.aggregate([
      // Unwind the items array
      { $unwind: '$items' },
      // Lookup to join with Products to get sellerId
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      // Unwind the productDetails array
      { $unwind: '$productDetails' },
      // Match items where the sellerId matches
      { $match: { 'productDetails.seller':new mongoose.Types.ObjectId(sellerId) } },
      // Project necessary fields
      {
        $project: {
          _id: 1,
          items: 1,
          totalQuantity: 1,
          totalPrice: 1,
          paymentStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          productDetails: { productName: 1, price: 1, images: 1 }
        }
      }
    ]);


      // const orders = await Order.find({ 'items.': sellerId })
      //   .populate('items.productId', 'productName price images')
      //   .populate('userId', 'username email');
  
      if (!orders || orders.length === 0) {
        return res.status(404).json(new ApiResponse(404,{},"No orders found for this seller"));
      }
  
      res.status(200).json(new ApiResponse(200,orders,"Orders fetched successfully !!"));
  })



  const getOrderStatisticsBySeller = asyncHandler( async (req, res) => {
    const sellerId = req.user._id;
      const statistics = await Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        { $match: {'productDetails.seller': new mongoose.Types.ObjectId(sellerId)}},
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
  

  const verifyPayment = asyncHandler(async (req,res)=>{
    const {rzpOrderId,paymentId,signature,orderId} = req.body;
    const secretKey = process.env.RZP_KEY_SECRET;
    const hmac = crypto.createHmac("sha256",secretKey);

    hmac.update(rzpOrderId+"|"+paymentId);

    const generatedSignature = hmac.digest("hex");


    if(generatedSignature===signature){
      await Order.findByIdAndUpdate(orderId,{paymentStatus:'paid'},{new:true})
      await Cart.findOneAndDelete({userId:req.user._id})
      return res.status(200).json(
        new ApiResponse(200,signature,"Payment Verified !!")
      )
    }
    else{
      await Order.findByIdAndUpdate(orderId,{paymentStatus:'failed'},{new:true})

      return res.status(400).json(
        new ApiResponse(400,{},"Payment not Verified !!")
      )
    }

  })

  export {addToCart,getCart,createOrder,getOrderById,getOrdersByUser,getOrdersBySeller,getOrderStatisticsBySeller,verifyPayment}
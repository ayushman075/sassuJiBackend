import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const getDashboardData = asyncHandler( async (req, res) => {
      const getDateRange = (period) => {
        const now = new Date();
        let start, end;
  
        switch (period) {
          case 'week':
            start = new Date(now.setDate(now.getDate() - 7));
            end = new Date();
            break;
          case 'month':
            start = new Date(now.setMonth(now.getMonth() - 1));
            end = new Date();
            break;
          case 'year':
            start = new Date(now.setFullYear(now.getFullYear() - 1));
            end = new Date();
            break;
          default:
            throw new Error('Invalid period specified');
        }
  
        return { start, end };
      };
  

      const getDateRangeFuture = (period) => {
        const now = new Date();
        let start, end;
  
        switch (period) {
          case 'week':
            end = new Date(now.setDate(now.getDate() + 7));
            start = new Date();
            break;
          case 'month':
            end = new Date(now.setMonth(now.getMonth() + 1));
            start = new Date();
            break;
          case 'year':
            end = new Date(now.setFullYear(now.getFullYear() + 1));
            start = new Date();
            break;
          default:
            throw new Error('Invalid period specified');
        }
  
        return { start, end };
      };


      const periods = ['week', 'month', 'year'];
  
      const salesData = {};
      const renewalData = {};
      
  
      for (const period of periods) {
        const { start, end } = getDateRange(period);
  
        salesData[period] = await Order.aggregate([
          
            { $unwind: "$items" },
        {
          $match: {
            "items.sellerId": req.user._id,
            createdAt: { $gte: start, $lte: end },
            paymentStatus:'paid'
          }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              totalSales: { $sum: "$totalPrice" },
              totalOrders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
  
        
      
          
      }
      for (const period of periods) {
        const { start, end } = getDateRangeFuture(period);
      renewalData[period] = await Order.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            paymentStatus:'paid',
            "items.validUpto": { $gte: start, $lte: end },
            "items.sellerId": req.user._id,
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$items.validUpto" } },
            totalRenewals: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }
        const cartData = await Cart.aggregate([
        {
          $match: {
            createdAt: {  $lte: new Date() }
          }
        },
        { $unwind: "$items" },
        {
            $match: {
              "items.sellerId": req.user._id,
            }},
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalProducts: { $sum: "$items.quantity" }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      res.status(200).json(new ApiResponse(200,{data:{salesData,renewalData,cartData}},"Fetched data successfully !!"));
   
  })

 export {getDashboardData} 
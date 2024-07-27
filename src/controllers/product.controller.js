import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";



const createProduct =asyncHandler( async (req, res) => {
    
    const { productName, description, price, category, stock, rating, numReviews, validity } = req.body;
  

    if([productName,description,price,category,stock].some((field)=>{
        return field===""||field===undefined
      })){
      return res.status(400).json(new ApiResponse(400,{},"Some fields are empty!!",false))
      }

      const imageLocalPath = req.file?.path;
     
      const images=[];
      
     if(imageLocalPath){
      const imgUrl= await uploadFileOnCloudinary(imageLocalPath);
      images.push(imgUrl);
     }

     const product = await Product.create({
      seller:req.user._id,
      productName:productName,
      description:description,
      price:price,
      category,
      stock,
      validity,
      images:images,
      rating,
      numReviews
     });

     return res.status(201).json(new ApiResponse(201,product,"Product created sucessfully !!"));
  })



const updateProduct =asyncHandler( async (req, res) => {
    
    const {id,updates} = req.body;

    if(!id || !updates){
      res.status(400).json(new ApiResponse(400,{},"Some fields are empty !!",false));
      throw new ApiError(400,"Some fields are empty!!");
    }
  
    const product = await Product.findById(id);
    if (!product) {
       res.status(404).json(new ApiResponse(404,{},"Product not found !!",false));
       throw new ApiError(400,"Product not found !!");
    }
    if (product.seller.toString() !== req.user.id) {
      res.status(403).json(new ApiResponse(403,{},"Unauthorized to perform action !!",false));
      throw new ApiError(403,"Unauthorized to perform action !!");
    }
    const updatedProduct = await Product.findByIdAndUpdate(id,updates,{new:true}).populate('seller', 'username email')
    return res.status(201).json(new ApiResponse(201,updatedProduct,"Product updated sucessfully !!"));
  })


  const deleteProduct = asyncHandler( async (req, res) => {
    const { id } = req.query;
    if(!id ){
      res.status(400).json(new ApiResponse(400,{},"Some fields are empty !!",false));
      throw new ApiError(400,"Some fields are empty!!");
    }
    const product = await Product.findById(id);
  
    if (!product) {
      res.status(404).json(new ApiResponse(404,{},"Product not found !!",false));
      throw new ApiError(400,"Product not found !!");
    }
    if (product.seller.toString() !== req.user.id) {
      res.status(403).json(new ApiResponse(403,{},"Unauthorized to perform action !!",false));
      throw new ApiError(403,"Unauthorized to perform action !!");
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    return res.status(201).json(new ApiResponse(201,{},"Product deleted sucessfully !!"));
  })


  const getProductById = asyncHandler( async (req, res) => {
    const { id } = req.query;
    const product = await Product.findById(id).populate('seller', 'username email');
  
    if (!product) {
      res.status(404).json(new ApiResponse(404,{},"Product not found !!",false));
      throw new ApiError(400,"Product not found !!");
    }

    return res.status(201).json(new ApiResponse(201,product,"Product deleted sucessfully !!"));

  })


const getProducts =asyncHandler( async (req, res) => {
    const {  sellerId, category,price ,rating, keyword} = req.query;
    const page = req.query.page;
    const limit  = req.query.limit;
  if(!page || !limit){
    res.status(400).json(new ApiResponse(400,{},"Some fields are empty !!",false));
      throw new ApiError(400,"Some fields are empty!!");
  }
    const query = {};
    if (sellerId) query.seller = sellerId;
    if (category) query.category = category;
    if (price) query.price = price;
    if (rating) query.rating = rating;
    if (keyword) query.$text = { $search: keyword };

    const products = await Product.find(query)
        .skip((page) * limit)
        .limit(Number(limit))
        .populate('seller', 'username email');
  
      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      

      return res.status(201).json(new ApiResponse(201,{products,currentPage:Number(page),totalPages, totalProducts: total},"Product searched sucessfully !!"));
  })
  const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    const limit = parseInt(req.query.limit) || 5;

    if (!keyword) {
        return res.status(400).json(new ApiResponse(400, {}, "Keyword is required", false));
    }

    const query = {
        $or: [
            { productName: { $regex: keyword, $options: 'i' } },
            { category: { $regex: keyword, $options: 'i' } }
        ]
    };

    try {
        const products = await Product.find(query)
            .limit(limit)
            .populate('seller', 'username email');

        // const suggestions = products.map(product => ({
        //     id: product._id,
        //     name: product.productName
        // }));

        return res.status(200).json(new ApiResponse(200, products, "Search suggestions fetched successfully!"));
    } catch (error) {
        console.error("Error fetching search suggestions:", error);
        res.status(500).json(new ApiResponse(500, {}, "Internal server error", false));
    }
});

const addReview = asyncHandler(async (req,res)=>{
  const {productId,rating,comment}=req.body;
  if([productId,rating,comment].some((field)=>{
    return field===""||field===undefined
  })){
  return res.status(400).json(new ApiResponse(400,{},"Some fields are empty!!",false))
  }

  const product  = await Product.findById(productId);

  if(!product){
    return res.status(404).json(new ApiResponse(404,{},"Product not found with given ID !!",false));
  }

  product.reviews.push({
    user:req.user._id,
    name:req.user.username,
    rating,
    comment
  })

  await product.save();

  return res.status(201).json(new ApiResponse(201,product,"Review added successfully !!",true))
  
})

const getReviews = asyncHandler(async (req,res)=>{
  const {productId} = req.query;
  if(!productId){
    return res.status(400).json(new ApiResponse(400,{},"Some fields are empty!!",false))

  }

  const product = await Product.findById(productId);
  if(!product){
    return res.status(404).json(new ApiResponse(404,{},"Product not found with given ID !!",false));
  }
  return res.status(200).json(new ApiResponse(200,product.reviews,"Reviews fetched successfully !!",true))
})
  
export {createProduct,updateProduct,deleteProduct,getProductById,getProducts,getSearchSuggestions,addReview,getReviews}

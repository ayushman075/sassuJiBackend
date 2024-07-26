import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createProduct, deleteProduct, getProductById, getProducts, getSearchSuggestions, updateProduct } from "../controllers/product.controller.js";



const productRouter = Router()
productRouter.route("/createProduct").post(
   verifyJWT,
   upload.single('image'),
   createProduct
  );
productRouter.route("/updateProduct").post(
   verifyJWT,
   updateProduct
  );
productRouter.route("/getProductById").get(
    getProductById
  );
  productRouter.route("/getProducts").get(
    getProducts
  );
  productRouter.route("/getSuggestions").get(
    getSearchSuggestions
  );
productRouter.route("/deleteProduct").get(
   verifyJWT,
   deleteProduct
  );


  export {productRouter}
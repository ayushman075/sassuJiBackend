import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { deleteProduct, getProductById, getProducts, updateProduct } from "../controllers/product.controller";



const productRouter = Router()
productRouter.route("/createProduct").post(
   verifyJWT,
   upload.single('image')
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
productRouter.route("/deleteProduct").post(
   verifyJWT,
   deleteProduct
  );


  export {productRouter}
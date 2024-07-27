import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const dashboardRouter = Router()
dashboardRouter.route("/getSellerData").get(
   verifyJWT,
   getDashboardData
  );


  export {dashboardRouter}
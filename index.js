import dotenv from "dotenv";
import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/db/connect.js";
import { userRouter } from "./src/routes/user.route.js";
import logger from "./logger.js";

//Expres app initialization
const app = express();

// env config
dotenv.config({
    path:'.env'
  });
  
  //app configuration setup
  app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
  }));
  app.use(express.json({limit:"16kb"}));
  app.use(express.urlencoded({extended:true,
    limit:"16kb"
  }));
  app.use(express.static("public"));
  app.use(cookieParser())
  
//Route import



//Route Declaration
app.use("/api/v1/user",userRouter)




//Rolling server
const port = process.env.PORT||3005;
connectDB().then((res)=>
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    logger.info(`Server listening on port ${port}`)
  })
).catch(()=>{
console.log("Error connecting to database !!")
logger.error("Error connecting to database !!")
});

app.get('/', (req, res) => {
  res.send('Welcome to SassuJi, on this line you are taking to SassuJi server !!');
});


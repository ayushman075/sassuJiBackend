import dotenv from "dotenv";
import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/db/connect.js";


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


//Rolling server
const port = process.env.PORT||3005;
connectDB().then((res)=>
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  })
).catch(()=>{
//error handling start
console.log("Error connecting to database !!")
//error handling end
});

app.get('/', (req, res) => {
  res.send('Welcome to SassuJi, on this line you are taking to SassuJi server !!');
});


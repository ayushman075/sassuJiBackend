import dotenv from "dotenv";
import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/db/connect.js";
import { userRouter } from "./src/routes/user.route.js";
import logger from "./logger.js";
const app = express();
dotenv.config({
    path: '.env'
});
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/api/v1/user", userRouter);
app.get('/', (req, res) => {
    res.send('Welcome to SassuJi, on this line you are talking to SassuJi server !!');
});
connectDB().then(() => {
    const port = process.env.PORT || 3005;
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        logger.info(`Server listening on port ${port}`);
    });
}).catch((err) => {
    console.log("Error connecting to database !!", err);
    logger.error("Error connecting to database !!", err);
});
export default app;

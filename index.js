import dotenv from "dotenv";
import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/db/connect.js";
import { userRouter } from "./src/routes/user.route.js";
import logger from "./logger.js";
import axios from 'axios';
import cheerio from 'cheerio';
import { HfInference } from '@huggingface/inference'
import { productRouter } from "./src/routes/product.route.js";
import { orderRouter } from "./src/routes/order.route.js";
// const axios = require('axios');
// const cheerio = require('cheerio');
// const hf = require('@huggingface/inference');
const app = express();
dotenv.config({
    path: '.env'
});
app.use(cors({
    origin:["http://localhost:5173", "http://localhost","https://saa-su-ji-buyers-frontend.vercel.app","https://saasuji-seller.vercel.app"],
    methods:["GET","POST","OPTIONS","UPDATE","DELETE"],
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
app.use("/api/v1/product",productRouter);
app.use("/api/v1/order",orderRouter);
app.get('/', (req, res) => {
    res.send('Welcome to SassuJi, on this line you are talking to SassuJi server !!');
});


//Scrapper Initialization
const hfClient = new HfInference('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');
app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('Please provide a URL to scrape');
    } 

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        
        const title = $('title').text();

      
        const description = $('meta[name="description"]').attr('content') || '';

    
        let textContent = '';
        $('body').find('*').each((index, element) => {
            if ($(element).children().length === 0 && $(element).text().trim() !== '') {
                if ($(element).is('a')) {
                   
                    return;
                }
                textContent += $(element).text().trim() + ' ';
            }
        });

      
        const inputs = `${title} ${description} ${textContent.trim()}`;
        const candidateLabels = ['software', 'course and learning', 'Templates', 'Creative resources'];

        const classificationResponse = await hfClient.zeroShotClassification({
            model: 'facebook/bart-large-mnli',
            inputs: [inputs],
            parameters: { candidate_labels: candidateLabels },
        });

        const { labels: labels1, scores: scores1 } = classificationResponse[0];
        const maxScoreIndex1 = scores1.indexOf(Math.max(...scores1));
        const highestCategory1 = labels1[maxScoreIndex1];

        const subcategories = ['operations', 'marketing & sales', 'build it yourself', 'media tools', 'finance', 'Development & IT', 'customer experience'];

        const classificationResponse2 = await hfClient.zeroShotClassification({
            model: 'facebook/bart-large-mnli',
            inputs: [inputs],
            parameters: { candidate_labels: subcategories },
        });

        const { labels: labels2, scores: scores2 } = classificationResponse2[0];
        const maxScoreIndex2 = scores2.indexOf(Math.max(...scores2));
        const highestSubcategory = labels2[maxScoreIndex2];

        res.json({
            title: title,
            description: description,
            textContent: textContent.trim(),
            highestCategory: highestCategory1,
            highestSubcategory: highestSubcategory,
            allCategories: labels1,
            allSubcategories: labels2,
            allScores1: scores1,
            allScores2: scores2,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred while scraping the website');
    }
});

//Connecting Database
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

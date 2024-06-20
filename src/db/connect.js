// mongodb+srv://kumarayushmanpandey075:dZN1ZQLgJHkWbhwb@cluster0.0ohxstk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

import mongoose from "mongoose";
const DB_NAME="SassuJiDatabase"

const  connectDB = async ()=>{
    try {
       const databaseConnectionResponse = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);

       //dev temp start
       console.log(`connected to database ${databaseConnectionResponse.connection.host}`)
        // dev temp end
    } catch (error) {
        //error handling start
        console.error("Error occurred while connecting to database !!" , error);
        //error handling end
        process.exit(1);
    }
}

export default connectDB; 

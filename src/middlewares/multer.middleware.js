import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      if(file){
      const uniqueSuffix = Date.now()  + Math.round(Math.random() * 1E9)
    let fileFormat= file.mimetype.split('/')
      cb(null, file.fieldname  + uniqueSuffix+'.'+fileFormat[fileFormat.length-1])
    
      }
    }
  })
  
 export const upload = multer({ storage: storage })
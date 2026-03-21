const multer=require('multer');
const cloudinary=require('cloudinary');
const dotenv=require('dotenv')
const fs=require('fs');

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API,
    api_secret:process.env.CLOUD_SECRET
});
const uploadToCloudinary=(file)=>{
    const option={
        resource_type:file.mimetype.startWith('video')?'video':'image',
    }
    return new Promise((resolve,reject)=>{
        const uploader=file.mimetype.startsWith('video')?cloudinary.uploader.upload_large:cloudinary.uploader.upload;
        uploader(file.path,option,(error,result)=>{
            fs.unlink(file.path,()=>{});
            if(error){
                return reject(error);
            }
            resolve(result)
        })
    })
}
const multerMiddleware=multer({dest:'uploads/'}).single('media');
module.exports={
    uploadToCloudinary,
    multerMiddleware
}
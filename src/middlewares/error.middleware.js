const errorHandler = (err,req,res,next)=>{
    res.status(err.statusCode || 500).json({
        success:false,
        message:err.message || 'Sever Error'
    })
}

module.exports= errorHandler    
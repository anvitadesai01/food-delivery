const validate=(schema)=>(req,res,next)=>{
    const {error,value}=schema.validate(req.body,{abortEarly:false})
    if(error){
        return res.status(400).json({
            success:false,
            errors:error.details.map((err)=>err.message.replace(/\"/g, ""))
        })
    }
    req.body=value
    next()
}
module.exports=validate
const jwt=require('jsonwebtoken');
const authentiCate=async(req,res,next)=>{
const token=req.header('Authorization')?.replace('Bearer ','');
if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
}
jwt.verify(token,"abcd",(err,decoded)=>{
    if (err) {
        return res.status(403).json({ message: 'You are Unauthorized, please Login' });
    }
  req.user=decoded;
  next()
})
}
module.exports={authentiCate}
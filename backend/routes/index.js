const express=require('express')
const userRouter=require('./user')
const accountRouter=require('./account')
const {authMiddleware}=require('../middleware.js')

const { default: mongoose}=require('mongoose')
const {User,Account}=require('../db.js')

const app=express()
const router=express.Router();

router.post('/me',authMiddleware,async (req,res)=>{
    if(!mongoose.Types.ObjectId.isValid(req.userID)) {
        return res.status(400).json({
            message:"Invalid user ID"
        })
    }
    const user =await User.findOne({_id: req.userID})
    if(!user) {
        return res.status(400).json({
            Authenticated: false,
            message: "user Not Found"
        })
    }
    const account=await Account.findOne({
        userID: req.userID
    })
    if(!account) {
        return res.status(400).json({
            Authenticated: false,
            message:"Account not found"
        })
    }

    res.status(200).json({
        Authenticated:true,
        message:"User is Authenticated"
    })
})

router.use('/user',userRouter)
router.use('/account',accountRouter)

module.exports=router
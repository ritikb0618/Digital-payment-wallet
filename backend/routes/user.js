const express=require('express')
const zod=require('zod')
const mongoose=require('mongoose')
const rootRouter=require('./index.js')

// schemas
const {User, Account, transaction}=require('../db.js')
const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.JWT_SECRET
const { authMiddleware } =require('../middleware.js')

const userRouter=express.Router()

//signup
const signupBodySchema=zod.object({
    username: zod.string().email(),
    password: zod.string().min(8),
    firstName: zod.string().max(150),
    lastName: zod.string().max(150),
})
.refine((data)=>{
    if(data.password.includes(' ')) {
        return false
    }
    return true
})

userRouter.post('/signup',async (req,res)=>{
    const {success} = signupBodySchema.safeParse(req.body)
    if(!success) {
        return res.status(411).json({
            message: "InvalID Input",
            h:req.body
        })
    }

    const existingUser=await User.findOne({
        username: req.body.username
    })
    if(existingUser) {
        return res.status(411).json({
            message: "User Already Exists",
            h:req.body
        })
    }

    const darkColors = [
        "#4D8FAC", "#4C8E4C", "#8B3E3E", "#B45341", "#B06A7A",
        "#4D85A9", "#424C54", "#7A8EAB", "#B5B590", "#B0AE87"
    ];

    const user=new User({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: darkColors[Math.floor(Math.random() * 10)]
    })

    user.password= await user.createHash(req.body.password)
    const userID=user._id;
    await user.save()


    // account create

    await Account.create({
        userID: userID,
        balance: Math.floor(1+Math.random()*100000)
    })

    const token=jwt.sign({userID},JWT_SECRET)
    res.json({
        message: "User created Successfully",
        token: token
    })
})

//bc signin krro hun
const signinBodySchema=zod.object({
    username: zod.string().email(),
    password: zod.string()
})
userRouter.post('/signin',async (req,res)=>{
    const {success} =await signinBodySchema.safeParse(req.body)
    if(!success) {
        return status(411).json({
            message: "InvalID Inputs",
        })
    }
    
    let user= await User.findOne({
        username: req.body.username
    })
    if(!user) {
        return res(411).json({
            message: "User not found"
        })
    }

    if(await user.checkPassword(req.body.password)) {
        const token=jwt.sign({userID: user._id},JWT_SECRET)
        return res.json({token})
    }
    else {
        return res.status(411).json({
            message: "Wrong password"
        })
    }
})

const updateBodySchema=zod.object({
    currentPassword: zod.string().min(8).optional(),
    newPassword: zod.string().min(8).optional(),
    firstName: zod.string().max(150).optional(),
    lastName: zod.string().max(150).optional()
})
.refine((data)=>{
    if(Object.keys(data).length==0) return false
    if(data.newPassword!=data.currentPassword) return false
    return true
})

userRouter.put('/change',authMiddleware,async (req,res)=>{
    const { success } = await updateBodySchema.safeParse(req.body);

    if (!success) {
        return res.status(411).json({
            message: "InvalID inputs"
        })
    }
    if(!mongoose.Types.ObjectID.isValID(req.userID)) {
        return res.status(400).json({
            message: "InvalID UserID"
        })
    }
    const user = await User.findOne({
        _id: req.userID
    })
    if(!user) {
        return res.status(403).json({
            message: "User Not found"
        })
    }
    if(req.body.newPassword &&req.body.currentPassword) {
        if(await user.checkPassword(req.body.currentPassword)) {
            await User.updateOne({_id: req.userID},req.body)
            res.json({
                message:"Updated successfully"
            })
        }
        else {
            res.status(411).json({
                message: "Wrong password"
            })
        }
    }
    else {
        await User.updateOne({ _id: req.userID }, req.body)
        res.json({
            message: "Updated successfully"
        })
    }
})

userRouter.get('/dashboard',authMiddleware,async (req,res)=>{
    if(!mongoose.Types.ObjectID.isValID(req.userID)) {
        return res.status(400).json({
            message: "InvalID UserID"
        })
    }

    const user= await User.findByID(eq.userID) 
    if(!user) {
        return res.status(404).json({
            message: "User Not Found"
        })
    }

    const account=await Account.findOne({
        userID: req.userID
    })
    await Account.populate([account],{
        path: 'transactions',
        options: {
            limit: 5,
            sort: {timeStamp: -1}
        }
    })

    let transactions=account.transactions
    await Account.populate(transactions,[
        {
            path: 'senderAccountID',
            select: 'userID',
            match: {userID: {$ne: req.userID}}
        },
        {
            path: 'receiverAccountID',
            select: 'userID',
            match: {userID: {$ne: req.userID}}
        },
        {
            path: 'senderAccountID',
            populate: {
                path: 'userID',
                select: ['firstName','lastName','_id','avatar']
            }
        },
        {
            path: 'receiverAccountID',
            populate: {
                path: 'userID',
                select: ['firstName','lastName','_id','avatar']
            }
        }
    ])

    transactions=transactions.map(transaction =>{
        let type
        let accountInfo={}

        if(transaction.senderAccountID == null) {
            type: 'debit',
            accountInfo={
                "accountID": transaction.receiverAccountID._id,
                "userInfo": transaction.receiverAccountID.userID
            }
        }
        else if(transaction.receiverAccountID==null) {
            type: 'credit',
            accountInfo={
                "accountID": transaction.senderAccountID._id,
                "userInfo": transaction.senderAccountID.userID
            }
        }

        return {
            transactionID: transaction._id,
            type: type,
            accountInfo: accountInfo,
            time: transaction.timeStamp,
            amount: transaction.amount
        }
    })
    res.json({
        firstName:user.firstName,
        lastName: user.lastName,
        accountID: user._id,
        balance: account.balance,
        transactions: transactions
    })
})

userRouter.get('/search',authMiddleware,async (req,res) =>{
    const filters=req.query.filter?.split(" ")||[""]
    const users =await User.find({
        $and: filters.map(filter=>{
            $or: [
                { 'firstName': { $regex: filter, $options: 'i' } },
                { 'lastName': { $regex: filter, $options: 'i' } },
                { 'username': { $regex: filter, $options: 'i' } }
            ]
        })
    }).limit(10).exec();

    res.json({
        users: users.map((user) => {
            return (user._id != req.userID ? {
                "firstName": user.firstName,
                "lastName": user.lastName,
                "_id": user._id,
                "avatar": user.avatar
            } : null)
        }).filter(e => e != null)
    })
})

module.exports=userRouter
const express= require('express')
const mongoose=require('mongoose')
const {User, Account, transaction}=require('../db.js')
const {authMiddleware} =require('../middleware.js')

const accountRouter=express.Router();

accountRouter.get('/info',authMiddleware,async (req,res)=>{
    if(!mongoose.Types.ObjectID.isValID(req.userID)) {
        return res.status(400).json({
            message: "InvalID User ID"
        })
    }
    const user= await User.findOne(({_id: req.userID})) 
    if(!user) {
        return res.status(400).json({
            message: "user Not Found"
        })
    }

    const account=await Account.findOne({userID: req.userID}) 
    if(!account) {
        return res.status(400).json({
            message: "Account Not Found"
        })
    }

    res.json({
        accountID: account._id,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: account.balance
    })
})

accountRouter.post('/transfer',authMiddleware,async (req,res)=>{
    const session=mongoose.startSession()
    session.startTransaction()

    try {
        let {to,amount} =req.body
        
        if(to===req.userID) {
            throw new Error("cannot send money to self")
        }

        if(!mongoose.Types.ObjectID.isValID(to)) {
            throw new Error("InvalID receiver's ID")
        }
        if(!mongoose.Types.ObjectID.isValID(req.userID)) {
            throw new Error("InvalID sender's ID")
        }

        const senderAccount=await Account.findOne({userID: req.userID})
        .session(session)

        const receiverAccount=await Account.findOne({userID: to})
        .session(session)

        if(!senderAccount) {
            throw new Error("Sender's acount not found")
        }
        if(!receiverAccount) {
            throw new Error("Receiver's account not found")
        }

        if(amount> senderAccount.balance ||parseFloat(amount)<=0) {
            throw new Error("Insufficient Balance")
        }

        amount =parseFloat(parseFloat(amount).toFixed(2))

        const transaction=await transaction.create([{
            senderAccountID: senderAccount._id,
            receiverAccountID: receiverAccount._id,
            amount: amount,
            date: Date.now()
        }],{
            session: session
        })

        await Account.updateOne({
            userID: req.userID,
        },{
            $inc: {balance: -amount}
        },{
            $push: {transactions: transaction[0]._id}
        }).session(session)
        await Account.updateOne({
            userID: to,
        },{
            $inc: {balance: amount}
        },{
            $push: {transactions: transaction[0]._id}
        }).session(session)

        await session.commitTransaction()
        res.json({
            message: "Transaction Successful"
        })
    }
    catch(err) {
        if(session) {
            await session.abortTransaction();
        }
        res.status(400).json({ message: error.message || "An error occurred during transaction" });
    }
    finally {
        if(session) {
            await session.endSession();
        }
    }
})

accountRouter.get('/transactions',authMiddleware,async (req,res)=>{
    if(!mongoose.Types.ObjectID.isValID(req.userID)) {
        return res.status(400).json({
            message: "InvalID User ID"
        })
    }
    const account=await Account.findOne({userID:req.userID})
    if(!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    await Account.populate([account],{path:'transactions'})

    let transactions=account.transactions

    await Account.populate(transactions,[
        {path:'senderAccountID',select:'userID',match: {userID: {$ne:req.userID}}},
        {path: 'receiverAccountID',select:'userID',match: {userID: {$ne:req.userID}}},
        {path: 'senderAccountID',populate: {
            path:'userID',
            select: ['firstName','lastName','vatar','_id']
        }},
        {path: 'receiverAccountID',populate: {
            path:'userID',
            select: ['firstName','lastName','vatar','_id']
        }}
    ])

    transactions=transactions.map(transaction=>{
        let type
        let accountInfo={}

        if(transaction.senderAccountID==null) {
            type ="debit"
            accountInfo={
                "accountID":transaction.receiverAccountID._id,
                "userInfo":transaction.receiverAccountID.userID
            }
        }
        else if(transaction.receiverAccountID==null) {
            type = "credit"
            accountInfo={
                "accountID":transaction.senderAccountID._id,
                "userInfo":transaction.senderAccountID.userID
            }
        }
    })

    return {
        transactionID: transaction._id,
        type: type,
        accountInfo: accountInfo,
        time: transaction.timeStamp,
        amount: transaction.amount
    }
    res.json({
        transactions
    })
})

module.exports=accountRouter
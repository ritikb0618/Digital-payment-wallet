require('dotenv').config();

const express= require('express');
const cors= require('cors');

const JWT_SECRET= process.env.JWT_SECRET;
const rootRouter= require('./routes/index.js')

const app=express()
const PORT=process.env.PORT ||5000

app.use(cors())
app.use(express.json())

app.use('/api/v1',rootRouter)
app.use((req,res,next)=>{
    const err=new Error("file not found")
    err.status=404
    next(err)
})

app.use((err,req,res,next)=>{
    res.status(err.status||500).json({
        message: err.message || "Oops, Something Went wrong"
    })
})

app.listen(PORT,()=>{
    console.log('Server is running on port',PORT)
})
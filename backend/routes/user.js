const express=require('express')
const zod=require('zod')
const mongoose=require('mongoose')
const rootRouter=require('./index.js')

// schemas
const {User, Account, transaction}=require('../db.js')
const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.JWT_SECRET
const {authMiddleware} = require('../middleware.js')
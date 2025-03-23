require('dotenv').config();

const express= require('express');
const cors= require(cors);

const JWT_SECRET= process.env.JWT_SECRET;
const rootRouter= require('./routes/index.js')

const app=express()
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')

try {
    await mongoose.connect(process.env.DATABASE_URI)
}
catch(err) {
    console.log(err)
}

const userSchema= mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 5,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        inlength: 8
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    avatar: {
        type: String,
        default: '#90EE90'
    }
})

// now lets add some sequrity to our passcodes
userSchema.methods.createHash=async(plainTextPassword) =>{
    const saltRounds=10
    const salt=await bcrypt.genSalt(saltRounds)

    return await bcrypt.hash(plainTextPassword, salt)
}

userSchema.methods.checkPassword=async function(userPassword) {
    return await bcrypt.compare(userPassword,this.password);
}

const accountSchema=mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        unique: true,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    transactions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transactions'
        }
    ]
})

const transactionSchema=mongoose.Schema({
    senderAccountID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    receiverAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        require: true
    },
    timeStamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    description: {
        type: String
    }
})

const Account=mongoose.model('Account',accountSchema)

const User=mongoose.model('User',userSchema)

const transaction=mongoose.model('transaction',transactionSchema)

module.exports={
    User,
    Account,
    transaction
}
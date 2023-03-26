const express = require('express') // hello
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const fs = require('fs')
require('dotenv').config()

//const upload = multer({ dest: 'uploads/' })

const User = require('./models/User')
const Post = require('./models/Post')

const app = express()

app.use(cors({credentials: true, origin: 'https://blogansh.onrender.com'}))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'))

app.post('/register', async (req, res) => {
    //res.json('this is post page of server')
    //const h = req.body
    //const w = JSON.parse(h)
    //res.send("h")
    const {username, password} = req.body
    //const hashedPassword = await bcrypt.hash(password, 12)
    try {
    const userDoc = await User.create({username, password: await bcrypt.hash(password, 12)})
    //res.json({requestData: {username, password}})
    res.json(userDoc)
    console.log("user created")
    console.log(userDoc)
    } catch (error) {
        //res.json()
        //res.status(404).send(error)
        res.status(250).json(error)
        console.log("user creation failed")
    }
})

const secret = "gdhcieduihirfofbouwehowhowowebfifyfodhuyegwehuwegfwohowedoediugfohoweh"

app.post('/login', async (req, res) => {
    const {username, password} = req.body
    const userDoc = await User.findOne({username: username})
    const passOk = await bcrypt.compare(password, userDoc.password)
    //const passOk = bcrypt.compareSync(password, userDoc.password)
    if (passOk) {
        //res.json(userDoc)
        //console.log('right password')
        //console.log(passOk)
        //console.log(userDoc.username)
        //console.log(userDoc)
        jwt.sign({username: username, id: userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err
            //res.json(token)
            res.cookie('token', token).json({
                id: userDoc._id,
                username
            })
        })
    } else {
        res.status(250).json("wrong credentials")
        console.log('password is wrong')
        console.log(passOk)
    }
})

app.get('/profile', (req, res) => {
    const {token} = req.cookies
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err
        res.json(info)
    })
    //res.json(req.cookies)
})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('okaayyyddoookeee')
})

app.post('/post', /* upload.single('file'), */ async (req, res) => {
  try {
    const {originalname, path} = req.file
    const parts = originalname.split(".")
    const ext = parts[parts.length - 1]
    const newPath = path+'.'+ext
    fs.rename(path, newPath, () => {
        console.log('file renamed')
    })

    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err
        const {title, summary, content} = req.body
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id
        })
        res.json(postDoc)
    })

    //res.json({files: req.file})
    //res.json({title: title, summary, content})
    //console.log(ext)
  } catch (err) {
    res.status(250).json(err)
    console.log(err)
    console.log('post creation failed')
  }
})

app.put('/post', /* upload.single('file'), */ async (req, res) => {
    //res.json({test:5, fileIs:req.file})
    let newPath = null
    if (req.file) {
        const {originalname, path} = req.file
        const parts = originalname.split(".")
        const ext = parts[parts.length - 1]
        newPath = path+'.'+ext
        fs.rename(path, newPath, () => {
            console.log('file renamed')
        })
    }

    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err
        const {id, title, summary, content} = req.body
        const postDoc = await Post.findById(id)
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id)
        //res.json({isBool:isAuthor,postDoc,info})
        if (!isAuthor) {
            return res.status(250).json({message: "wrong author"})
        }
        /* await postDoc.update({
            title: title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover
        }) */
        const updateDoc = await Post.findByIdAndUpdate(id, 
        {title, summary, content, cover: newPath ? newPath : postDoc.cover},
        {new: true})
        res.json(updateDoc)
    })
})

app.get('/post',  async (req, res) => {
    const posts = await Post.find().populate('author', ['username']).sort({createdAt: -1})//.limit(3)
    res.json(posts)
})

app.get('/post/:id', async (req, res) => {
    const {id} = req.params
    const postDoc = await Post.findById(id).populate('author', ['username'])
    res.json(postDoc)
    //res.json(req.params)
})

async function connect() {
    try {
        await mongoose.connect(process.env.DATABASE2, {
    //await mongoose.connect("mongodb+srv://ansh:VqWD0mRC8hWgdVsp@cluster0.nsmokc2.mongodb.net/?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(con => {
        console.log("DataBase connection successful")
    })
        } catch (error) {
            console.log("Failed to connect to database")
        }
    }    
connect()

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}.....`)
})


// connection-string ----

// mongodb+srv://ansh:<password>@cluster0.nsmokc2.mongodb.net/?retryWrites=true&w=majority

// project name ---  blog-app
// username ---      ansh
// password ---      VqWD0mRC8hWgdVsp
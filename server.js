const express = require("express") //for creating server
const multer = require("multer") //for handling multi-media
const path = require("path") //path module for folder/dir paths
const fs = require("fs") //interacting w file system
const util = require("util") //accessing util functions like below
const unlinkFile = util.promisify(fs.unlink) //unlinking files in file system

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + path.extname(file.originalname))
    }
  })
  
const upload = multer({ //multer object used to upload
    storage: storage,
    limits: {fileSize:1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb)
    }
}).any()

function fileFilter (file, cb) { //checks if the uploaded filetype is correct
    const fileTypes = /jpeg|png|jpg/
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase()) //tests if file's name is in fileTypes path.ext is the extension 
    const mimetype = fileTypes.test(file.mimetype)

    if(mimetype && extname){  
        return cb(null, true)   //cb is a callback function. it can be any function that works 
    } else{                        //when calling fileFilter, you specify which function in fileFilter params
        cb("Please upload images only") 
    }
  }

const port = 3000  //port to run app

const app = express() //instance of express package

app.use(express.json()) //middleware to process frontend
app.use(express.urlencoded({extended:false}))

app.set("view engine", "ejs")  //view engine: ejs

app.use(express.static("public")) //permission to access public folder

app.get("/", (req, res) => { //get route that renders the index.ejs file in views
    let images = []
    fs.readdir("./public/uploads/", (err, files) => {
        if(!err){
            files.forEach(file =>{
                images.push(file)
            })
            res.render("index", {images:images})
        } else {
            console.log(err)
        }
    })
})

app.post("/upload", (req, res) => {   //this is for the post fetch request in index.ejs
    upload(req, res, (err) => { 
        if(!err && req.files != ""){
            res.status(200).send() //the 200 status is specified as a response in index.ejs
        } else if(!err && req.files == ""){
            res.statusMessage = "Please select an image to upload"
            res.status(400).end()
        } else{
            res.statusMessage = (err === "Please upload images only") ? err : "Photo exceeds limit of 1 MB"
            res.status(400).end()
        }
    })
})

app.put("/delete", (req, res) => {
    const deleteImages = req.body.deleteImages
    if(deleteImages == ""){
        res.statusMessage = "Please select an image to delete"
        res.status(400).end()
    } else{
        deleteImages.forEach(image => {
            unlinkFile(".public/uploads/" + image)
        })
        res.statusMessage = "Successfully deleted"
        res.status(200).end()
    }
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`) //success notification
})

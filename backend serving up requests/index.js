import express from "express"
import bodyParser from "body-parser"
import morgan from "morgan"
import pg from "pg"
import "dotenv/config"
import PasswordValidator from "password-validator"

const app = express()
const port = 5000
const USER = process.env.DB_USER
const PASSWORD = process.env.DB_PASSWORD
const HOST = process.env.DB_HOST
const DATABASE = process.env.DB_DATABASE
const PORT = process.env.DB_PORT
const {Pool} = pg
const db = new Pool({
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    host: HOST,
    port: PORT
})
const validationErrors = {
    //Book validation
    incompleteFields: "One or more fields are missing",
    shortTitle: "Title of book is too short",
    shortComment: "User comment is too short",

    //Password validation
    noMatch: "Both passwords do not match",
}

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")

async function authChecker(user){
    let authorised
    const userId = user.id
    const userPass = user.password
    const userName = user.userName

    try{
        const result = (await db.query("SELECT username, password FROM users WHERE id = $1", [userId])).rows
        if((result[0].username == userName) && (result[0].password == userPass)){
            authorised = true
        }else{
            authorised = false
        }

        return authorised
    }catch(err){
        return console.error(err.stack)
    }
}

async function getAllUserBooks(user){
    const userId = user.id
    try{
        const result = (await db.query("SELECT * FROM books WHERE user_id = $1", [userId])).rows
        return result
    }catch(err){
        return console.error(err.stack)
    }
}

async function bookInsertValidator(book){
    if((book.title) && (book.comment) && (book.user_id)){
        if(book.title.length > 5){
            if(book.comment.length > 15){
                const dateOfToday = new Date()
                try{
                 return (await db.query("INSERT INTO books (title, comment, date_read, user_id) VALUES ($1, $2, $3, $4) RETURNING id, title, comment, date_read, user_id", [book.title, book.comment, dateOfToday, book.user_id])).rows 
                }catch(err){
                    return console.error(err)
                }
            }else{
                return {error: validationErrors.shortComment}
            }
        }else{
            return {error: validationErrors.shortTitle}
        }
    }else{
        return {error: validationErrors.incompleteFields}
    }
}

async function addUser(user){
    let schema = new PasswordValidator()

    schema
    .is().min(8)                                    // Minimum length 8
    .is().max(30)                                   // Maximum length 30
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(2)                                // Must have at least 2 digits
    .has().not().spaces()                           // Should not have spaces

    const valid = schema.validate(user.password)
    if(valid == true){
        if(user.password == user.confirmedPassword){
            try{
                const result = (await db.query("INSERT INTO users (name, username, password) VALUES ($1, $2, $3) RETURNING id, name, username, password", [user.name, user.userName, user.password])).rows
                return result
            }catch(err){
                console.error(err)
            }
        }else{
            return {error: validationErrors.noMatch}
        }
    }else{
        return {error: schema.validate(user.password, {details: true})}
    }
}

app.get("/all-user-books", async (req, res)=>{
    const user = {
        id: req.body.id,
        password: req.body.password,
        userName: req.body.userName
    }
    const authorised = await authChecker(user)
    if(authorised == true){
        const books = await getAllUserBooks(user)
        res.status(200).json(books)
    }else{
        res.sendStatus(401)
    }
})

app.post("/add-book", async (req, res)=>{
    const book = {
        title: req.body.title,
        comment: req.body.comment,
        user_id: req.body.user_id
    }
    try{
        const result = await bookInsertValidator(book)
        res.json(result)
    }catch(err){
        console.error(err)
    }
})

app.post("/add-user", async (req, res)=>{
    const user = {
        name: req.body.name,
        password: req.body.password,
        confirmedPassword: req.body.confirmedPassword,
        userName: req.body.userName
    }

    try{
        const result = await addUser(user)
        if(result)
        res.json(result)
    }catch(err){
        console.error(err)
    }
})

app.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`)
})

// console.log(req.body)  -  { id: '3', password: 'Denga', userName: 'filemon' }
//db data  -  [ { username: 'vadinho14', password: 'greatGOAT654' } ]
import express from "express"
import axios from "axios"
import pg from "pg"
import "dotenv/config"

const app = express()
const PORT = 3000
const {Pool} = pg
const db = new Pool({
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    host: HOST,
    port: PORT
})

app.use(express.static("public"))
app.set("view engine", "ejs")

async function authenticateUser(credentials){
    const userName = credentials.username
    const userPass = credentials.password
    try{
        const result =  db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [userName, userPass]).rows
        return result
    }catch(err){
        return console.error(err)
    }
}

app.post("/login", async (req, res)=>{
    // response = await axios.
    const credentials = {
        
    }
    const isAuthenticated = authenticateUser()
})

app.get("/sign-up", (req, res)=>{

})

app.get("/", async (req, res)=>{
    res.render("login")
})

app.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`)
})



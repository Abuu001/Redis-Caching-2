const express = require('express')
const fetch = require('node-fetch');
const redis =require('redis')
const app = express();

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;


const client = redis.createClient(REDIS_PORT);
app.use(express.json())

//setResponse func
function setResponse(username,repos){
    return `<h2>${username} has ${repos} Github repositories</h2>`
}

async function getRepos(req,res){
    try {
        console.log("Fetching data");
        const {username} =req.params;
 
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json(); 

        const repos = data.public_repos;

        //set data to redis
       client.setex(username,3600 ,repos);

        res.status(200).send(setResponse(username,repos));

    } catch (error) {
        console.error(error);
        res.status(500)
    }
}

//cache Middleware
function cache(req,res,next){

    const {username} = req.params;

    client.get(username,(err,data)=>{
        if(err) throw err;
        if(data !==null){
            res.send(setResponse(username,data))
        }else{
            next();
        }
    })
}

app.get('/repos/:username',cache,getRepos)

app.listen(PORT,()=>`Server Running on port ${PORT}`)
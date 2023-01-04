const express = require("express");
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("./model");

const app = express();
const server = http.createServer(app);


let mongoConnect = async () => {
    await mongoose.connect('mongodb://localhost:27017/authExpress')
                  .then(res => {
                    console.log('Connected to DB');
                  })
                  .catch(err => {
                    throw new Error(err);
                  });
} 
mongoConnect();


//MIDDLEWARE

app.use(bodyParser.json({ extended:true }));

const verifyUser = (req,res,next) => {
    let requestToken = req.headers.authorization?.split(' ')[1];
    console.log('This is rt', requestToken);
    if(requestToken == undefined){
        return res.status(403).send('Request denied.Please login to get token.');
    }

    try {
        let decodedToken = jwt.verify(requestToken, 'Thisisthesecretkey');
        let { email } = decodedToken;
        req.user = email;
        console.log(email);
    } catch (error) {
        return res.status(401).send('Invalid token');
    }

    return next();
}


app.post('/login', async (req, res) => {
    try {
        console.log(req);
        let { email, password } = req.body;
        console.log('Send details', email, password);
        if(!(email && password)){
            res.status(400).send('Please fill all details')
        }

        let checkUserExists = await User.findOne({ email });
        if(checkUserExists){
            let encryptPasswordCompare = await bcrypt.compare(password, checkUserExists.password);
            if(encryptPasswordCompare){
                let token = jwt.sign(
                    {userId:checkUserExists.id, email:checkUserExists.email},
                    'Thisisthesecretkey',
                    {
                        expiresIn:'3hrs'
                    }
                    );
                res.status(200).send({
                    token
                });
            } else {
                res.status(400).send('Invalid Login credentials,try again!');
            }
        } else {
            res.status(404).send('User does not exists.Please try again or register.')
        }
    } catch (error) {
        throw new Error(error);
    }
})


app.post('/register', async (req,res) => {
    try {
        if(!(req.body.name && req.body.email && req.body.password && req.body.confirmPassword)){
            res.send('Please fill in all details').status(400)
        }

        let userEmailExists = await User.findOne({ email: req.body.email });

        if(userEmailExists){
            res.status(409).send('User already exists,Login.');
        } else {

            let encryptedPassword = await bcrypt.hash(req.body.password, 10);
            
            let newUser = new User({
                name : req.body.name,
                email : req.body.email,
                password : encryptedPassword
            });
        
            let savedUser = await newUser.save();
            res.send(savedUser).status(200);
        }
    } catch (error) {
        throw new Error(error);
    }
})


app.get('/something', verifyUser,(req,res) => {
    res.send('Hello from a secured route');
})

server.listen(3000, () => {
    console.log("App started on port 3000");
})
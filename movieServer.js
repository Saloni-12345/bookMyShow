let express = require("express");
let jwt = require("jsonwebtoken");
let passport = require("passport");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;
let app = express();
app.use(express.json());
app.use(function(req,res,next){
res.header("Access-Control-Allow-Origin","*");
res.header("Access-Control-Allow-Headers",
"Origin,X-Requested-With,Content-Type,Accept,Authorization");
res.header("Access-Control-Allow-Methods",
"GET, POST, PUT, HEAD, PATCH, DELETE, OPTIONS");
next();
})
app.use(passport.initialize());
let port = process.env.PORT||2410;
app.listen(port,()=> console.log(`Node app listening on port ${port}!`));
let params = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey : "jwtToken12345678",
}
let jwtExpirySecond = 3600;
let allData = require("./data.js");
let { moviesData ,loginData,bookingArr } = allData;
let fname = "movie.json";
let fs = require("fs");
let strategy = new JWTStrategy(params, function(token, done ){
  console.log("In All Strategy Login", token);
  fs.readFile(fname,"utf8",function(err,result){
if(err) res.status(401).send(err);
else{
  let data = JSON.parse(result);
  let user = data.loginData.find(u=> u.id === token.id);
  if(!user) return done(null, false , {message:"Incorrect username or password"});
  else return done(null, user);
 } })
})
passport.use("roleAll",strategy);

app.post("/login", function(req,res){
 let { email } = req.body;
 fs.readFile(fname,"utf-8",function(err,result){
  if(err) res.status(401).send(err)
  else{
    let data1 = JSON.parse(result);
 let user = data1.loginData.find(u=> u.email === email);
 if(user){
  let payload = { id : user.id};
  let token = jwt.sign(payload, params.secretOrKey,{
    algorithm:"HS256",
    expiresIn: jwtExpirySecond
  });
  res.send({token : "bearer "+ token});
 } }})
})
app.get("/user",passport.authenticate("roleAll", {session: false}),
function(req,res){
  res.send(req.user);
})
app.get("/purchase",passport.authenticate("roleAll",{session: false}),function(req,res){
fs.readFile(fname,"utf8",function(err,result){
 if(err) res.status(404).send(err);
 else{
  let data = JSON.parse(result);
 let purchase = data.bookingArr.filter((b1)=>b1.userId === +req.user.id);
   res.send(purchase);
 }
})
})
app.get("/setData",function(req,res){
 let data1 = {...allData};
 let data = JSON.stringify(data1);
 fs.writeFile(fname,data,function(err){
  if(err) res.send(err);
  else res.send("Data reset");
 })
})
app.post("/movies",function(req,res){
  fs.readFile(fname,"utf8",function(err,result){
    if(err) res.status(401).send(err);
    else{
       let data = JSON.parse(result);
       let maxid = data.moviesData.reduce((acc,curr)=>curr.id>acc?curr.id:acc,0);
       let newid = maxid+1;
       let newMovie = { id: newid, ...req.body};
       data.moviesData.unshift(newMovie);
       let data1 = JSON.stringify(data);
       fs.writeFile(fname,data1,function(err1){
        if(err) res.status(401).send(err1)
        else res.send(newMovie);
       })
    }})
})
app.post("/newLogin",function(req,res){
fs.readFile(fname,"utf8",function(err,result){
if(err) res.status(401).send(err);
else{
     let data = JSON.parse(result);
     let maxid = data.loginData.reduce((acc,curr)=>curr.id>acc?curr.id:acc, 0);
     let newid = maxid +1;
     let newUser = {id: newid, ...req.body}
     data.loginData.push(newUser);
     let data1 = JSON.stringify(data);
     fs.writeFile(fname,data1,function(err1){
      if(err1) res.status(401).send(err1)
      else res.send(newUser);
     }) 
 }})
})
app.put("/editLogin",passport.authenticate("roleAll",{session:false}), function(req,res){
  fs.readFile(fname,"utf8",function(err,result){
    if(err) res.status(401).send(err);
    else{
       let data = JSON.parse(result);
       let index = data.loginData.findIndex((l1)=>l1.id === +req.user.id);
       if(index>=0){
        let updated = {...data.loginData[index],...req.body}
         data.loginData[index] = updated
       let data1 = JSON.stringify(data);
       fs.writeFile(fname,data1,function(err1){
        if(err1) res.status(401).send(err1)
        else res.send(updated); 
      })}
      else res.status(401).send("No User found");
}})})
app.post("/booked",passport.authenticate("roleAll",{session:false}),function(req,res){
  fs.readFile(fname,"utf8",function(err,result){
    if(err) res.status(401).send(err);
    else{
       let data = JSON.parse(result);
       let maxid = data.bookingArr.reduce((acc,curr)=>curr.bookingId>acc? curr.bookingId:acc,0);
       let newid = +maxid +1;
       let purdata = {bookingId: newid, userId: req.user.id,...req.body}
       data.bookingArr.push(purdata);
       let data1 = JSON.stringify(data);
       fs.writeFile(fname,data1,function(err1){
        if(err1) res.status(401).send(err1)
        else res.send(purdata); 
       })
    }
  })
})
app.get("/movies/:city",function(req,res){
let city = req.params.city;
let { q ,lang ,format,genre } = req.query;
let lang1 = lang?lang.split(","):null;
let format1 = format?format.split(","):null;
let genre1 = genre?genre.split(","):null;
fs.readFile(fname,"utf-8",function(err,result){
if(err) res.status(401).send(err)
else{
let data = JSON.parse(result);
let arr = data.moviesData;
let arr1 = arr.filter((a1)=>a1.cities.find((c1)=>c1===city));
if(q) arr1 = arr1.filter((a1)=>a1.title.includes(q));
if(lang1) arr1 = arr1.filter((a1)=>lang1.find((l2)=>a1.languages.find((l1)=>l1===l2)));
if(format1) arr1 = arr1.filter((a1)=>format1.find((f2)=>a1.format.find((f1)=>f1===f2)));
if(genre1) arr1 = arr1.filter((a1)=>genre1.find((g1)=>a1.typeOf.find((t1)=>t1===g1)));
res.send(arr1);
}
})})
app.get("/movies/:city/:title/:id",function(req,res){
let { city, title, id } = req.params;
fs.readFile(fname,"utf8",function(err,result){
if(err) res.status(401).send(err);
else{
  let data = JSON.parse(result);
let movie = data.moviesData.find((d1)=>d1.id === +id && d1.title.startsWith(title));
let citydata = data.cityBookingArr.find((c1)=>c1.cityName === city).cityBookSlot;
if(movie){
  res.send({movieData:movie, cityBookingData: citydata});
}else res.status(404).send("No Movie Found")
}})
})
app.put("/movies/:id",function(req,res){
  let { id } = req.params;
  fs.readFile(fname,"utf8",function(err,result){
  if(err) res.status(401).send(err);
  else{
    let data = JSON.parse(result);
    let index = data.moviesData.findIndex((d1)=>d1.id === +id);
   if(index>=0){
    let updated = {...data.moviesData[index],...req.body};
    data.moviesData[index] = updated;
    let data1 = JSON.stringify(data);
    fs.writeFile(fname,data1, function(err1){
      if(err1) res.status(404).send(err1)
      else  res.send(updated);
    })
  }else res.status(404).send("No Movie Found")
  }})
})
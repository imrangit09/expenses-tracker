var express = require('express');
var router = express.Router();

const User = require("./users")
const postmodel = require("./expencedata")
const passport = require("passport")
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/resister',(req,res)=>{
  var userdata = new User({
    username:req.body.username,
    email:req.body.email,
    secret:req.body.secret
  });
  User.register(userdata, req.body.password)
  .then(function(resistereduser){
    passport.authenticate("local")(req,res, function(){
      res.redirect('/login')
    })
  })
});

router.get('/homepage', function(req, res, next) {
  res.render('homepage');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post("/login",passport.authenticate("local", {
  successRedirect:"/expence",
  failureRedirect:"/login"
}),function(req,res,next) {});


router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(() => {
      res.redirect("/login");
  });
});
router.get('/forget', function(req, res, next) {
  res.render('forget');
});

router.post("/forget",async function(req,res,next){
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user)
        return res.send("User not found! <a href='/forget'>Try Again</a>.");

    await user.setPassword(req.body.newpassword);
    await user.save();
    res.redirect("/login");
} catch (error) {
    res.send(error);
}

})


// AUTHENTICATED ROUTE MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/login");
    }
}

router.post("/add-expence",isLoggedIn,async function(req,res,next){
  const currentUser = await User.findOne({ _id: req.user._id })
  const newPost = await postmodel.create({
    title: req.body.title,
    amount: req.body.amount,
    category: req.body.category,
    caption:req.body.caption,
    owner:currentUser._id
  })
  currentUser.posts.push(newPost._id)
  await currentUser.save()
  // res.send(newPost)
  res.redirect("/expence")
})

router.get('/expence',isLoggedIn, async function(req, res, next) {
  const data = await User.findOne({_id:req.user._id}).populate("posts")
  res.render('expence',{data});
  // console.log(expencedata);
});

router.get("/delete/:id",isLoggedIn,async function(req,res,next){
      try {
        await postmodel.findByIdAndDelete(req.params.id)
        res.redirect("/expence")
      } catch (error) {
        res.send(error)
      }
})

router.get("/update/:id",isLoggedIn,async function(req,res,next){
  try {
  const  data =  await postmodel.findById(req.params.id)
    res.render("update",{data})
  } catch (error) {
    res.send(error)
  }
})

router.post("/update/:id",isLoggedIn ,async function(req,res,next){
  try {
    await postmodel.findByIdAndUpdate(req.params.id,req.body)
    res.redirect(`/expence`)
  } catch (error) {
    res.send(error)
  }
})
module.exports = router;


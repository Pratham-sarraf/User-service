const express = require("express");
const app = express();

const connectDB = require("./utils/db");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/user");
const contactUs=require("./models/contactUs");
const bcrypt = require('bcrypt');
require("dotenv").config();

const mongoose = require("mongoose");

// ✅ EJS SETUP (ADD THIS)
app.set("view engine", "ejs");       // tells Express to use EJS


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // if forms are used

// ✅ ROUTES
app.use("/", userRoutes);

// ✅ YOUR FETCH ROUTE
app.get("/fetch-other-db", async (req, res) => {
    try {
        // ✅ 1. Connect to second DB
        const otherDB = mongoose.createConnection(
            "mongodb+srv://pratham_sarraf_22:1234@cluster0.4me9u.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0"
        );

        otherDB.on("connected", async () => {
            console.log("✅ Connected to other-db");

            const tempSchema = new mongoose.Schema({}, { strict: false });
            const RemoteProduct = otherDB.model("contactSchema", tempSchema, "contact_us");

            const products = await RemoteProduct.find({});

            const LocalProduct = require("./models/contactUs");

            // ❗ Optional: Avoid duplicate _id issue
            const cleanProducts = products.map(p => {
                const obj = p.toObject();
                delete obj._id;
                return obj;
            });

            await LocalProduct.insertMany(cleanProducts);

            res.send("✅ DONE — Products copied into Local Product DB");
            otherDB.close();
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Error fetching products");
    }
});

app.post("/findById",async(req,res)=>{
    
  try{
    const user=await User.findById(req.body.id);
    res.json(user);

  }
  catch(err){
     res.send("ID not valid");
  }

})

app.post("/findByIdAndSaveAddress",async(req,res)=>{

  const {id,newAddress}=req.body;
    
  try{
    const user=await User.findById(id);
      user.address.push(newAddress);
      await user.save();
    res.json("ADDRESS SAVED SUCCESFULLY");

  }
  catch(err){
     res.send("ID not valid");
  }

})

app.post("/findByIdAndBuy",async(req,res)=>{
    
  try{
    const user=await User.findById(req.body.id);
     
          user.orders += 1;
      await user.save();

      res.json("DONE");

  }
  catch(err){
     res.send("ID not valid");
  }

})
app.post("/findByIDAndSave", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).send("User created");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Some error occurred");
  }
});





app.post("/userIdArray",async(req,res)=>{
const { users_reviews: userIds } = req.body;


   //validation

        console.log(req.body.users_reviews);
  
        const user_id_array_promise=req.body.users_reviews.map((id,inx)=>{
          return User.findById(id);
        })

         const final_user=await Promise.all(user_id_array_promise);

 

  res.json(final_user);

})



app.post("/addToCart",async(req,res)=>{

  try{
     const userId = req.body.userId;
      const productId = req.body.productId;

      const user = await User.findById(userId);
      if (!user) return res.status(404).send("User not found");

      user.products.push(productId);
      await user.save();
      res.json("Added to cart");
  }
  catch(err){
    console.log("ERROR IN  /addToCart",err);
    res.send("SOME ERROR IN INSERTING TO CART");
  }
   
})


app.post("/updateCart",async(req,res)=>{
  try{
    const { productId, quantity } = req.body;

    const user=await User.findById(req.body.userId);

   // Remove all occurrences of that product
      user.products =user.products.filter(
        id => id.toString() !== productId
      );

      // Push productId 'quantity' times
      for (let i = 0; i < quantity; i++) {
        user.products.push(productId);
      }

      await user.save();
      res.json({ success: true });
    } catch (err) {
      console.error("Cart update error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
})

app.get("/countUsersandReviews",async(req,res)=>{
  try{
    const totalUsers=await User.countDocuments()-1;

    const totalReviews=await contactUs.countDocuments();
    res.json({totalUsers,totalReviews});
  }
  catch{
    res.send("UNABLE TO FETCH ALL USERS");
  }
})


app.get("/getProductArray",async(req,res)=>{

  const product_ids=await User.find({},{products:1});
  const refined_product_ids=product_ids.map((elem,inx)=>{
    return elem.products;
  })
  res.json(refined_product_ids);
})


// ✅ SERVER START

const PORT=process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Server failed to start due to database error:", err);
  });

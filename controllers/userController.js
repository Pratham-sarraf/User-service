const bcrypt = require("bcrypt");
const User = require("../models/user");
const contactUs = require("../models/contactUs");

const userController = {
 


  // PUT /update-profile
  updateProfile: async (req, res) => {
    const { userId,updateData } = req.body;
    try {
      await User.findByIdAndUpdate(userId, updateData);
      res.json({ message: "Profile updated successfully!" });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Update failed: " + err.message });
    }
  },

  // POST /products/all-products/save-address
  saveAddress: async (req, res) => {
    const { houseNo, street, city, country, pincode, saveAs } = req.body;

    try {
      const user = await User.findById(req.user._id);
      const newAddress = { houseNo, street, city, country, pincode, saveAs };

      user.address.push(newAddress);
      await user.save();

      res.redirect('/products/all-products');
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving address");
    }
  },

  // GET /dashboard
  getDashboard: (req, res) => {
    res.send("WELCOME TO DASHBOARD");
  } ,

//   findUser : async (req, res) => {
//   const { id } = req.params;
//   const user = await User.findById(id);
//   res.json(user);
// },

//   getUserForReview: async (req, res) => {
//     const userId = req.params.id;

//     try {
//       // Fetch only safe public fields
//       const user = await User.findById(userId).select("username email role");
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Optional: filter down to only review-safe info
//       res.json({
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role
//       });
//     } catch (err) {
//       console.error("Error fetching user for review:", err);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },


// NAYA FUNCTION (Sirf internal use ke liye)
validateCredentials : async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Password match ho gaya!
    // Hum token nahi, balki 'user' ka data bhejenge
    // taaki auth-service is data se token bana sake
    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        role: user.isAdmin ? 'admin' : 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in user-service' });
  }
},
// POST /micro-service/register
postRegister : async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 3) {
    return res.status(400).json({ 
      message: 'Please provide a username and a password (at least 6 characters)' 
    });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      // JSON mein error bhejein
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Create and save new user
    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();

    // 4. Redirect NAHI. Sirf success ka JSON message bhejein.
    res.status(201).json({ // 201 = Created
      status: 'success',
      message: 'User created successfully. Please login.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong in user-service' });
  }
}
,




  

  
    // GET /admin/users
    getUsers: async (req, res) => {
      try {
        console.log("I AM IN /admin/users");
        const allUsers = await User.find();
        res.json(allUsers);
      } catch (err) {
        console.error(err);
        res.send('Error loading users');
      }
    }
    ,
  
 
  
    // GET /admin/user/:id/admin-user-display
    getUserDetail: async (req, res) => {
      try {
        const userId = req.params.id;
        const user = await User.findById(userId).populate("products");
  
        if (!user) return res.status(404).send("User not found");
  
        // Count product quantities
        const productQuantities = {};
        user.products.forEach(product => {
          const productId = product._id.toString();
          productQuantities[productId] = (productQuantities[productId] || 0) + 1;
        });
  
        // Get unique products with quantities
        const uniqueProducts = [];
        const seenProducts = new Set();
        
        user.products.forEach(product => {
          const productId = product._id.toString();
          if (!seenProducts.has(productId)) {
            seenProducts.add(productId);
            uniqueProducts.push({
              ...product.toObject(),
              quantity: productQuantities[productId]
            });
          }
        });
  
        res.render("admin-user-display", { 
          user,
          products: uniqueProducts 
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    },
  
    // POST /admin/users/:id/toggle-admin
    toggleAdmin: async (req, res) => {
      try {
        
    
     
        
        const userId = req.params.id;
        const { isAdmin } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
          userId, 
          { isAdmin: isAdmin },
          { new: true }
        );
        
        if (!updatedUser) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
  
        const message = isAdmin ? "User made admin" : "User removed from admin";
        
        res.json({ 
          success: true, 
          message: message,
          user: updatedUser 
        });
      } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    },
  
    // GET /admin/contact-us
    getContactSubmissions: async (req, res) => {
      try {
        const contacts = await contactUs.find().sort({ createdAt: -1 });
        res.json(contacts);
      } catch (err) {
        console.error("Error fetching contact submissions for admin page:", err);
        res.status(500).send("An error occurred while fetching contact submissions. Please check server logs.");
      }
    },
  
    // DELETE /admin/contact-us/:id
    deleteContactSubmission: async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await contactUs.findByIdAndDelete(id);
  
        if (!deleted) {
          return res.status(404).json({ message: "Contact not found" });
        }
  
        res.send("done");
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    },
  




};







module.exports = userController;


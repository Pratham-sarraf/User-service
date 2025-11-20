const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const contactController = require("../controllers/contactController");
// User routes
router.put("/update-profile", userController.updateProfile);
router.post("/products/all-products/save-address", userController.saveAddress);
router.get("/dashboard", userController.getDashboard);



router.post('/micro-service/register', userController.postRegister);
router.post('/micro-service/validate-credentials', userController.validateCredentials);

// router.get("/micro-service/:id",userController.findUser);
// router.get("/micro-service/review/:id", userController.getUserForReview);







//ADMIN ROUTES





// User management
router.get("/admin/user/:id/admin-user-display", userController.getUserDetail);
router.post("/admin/users/:id/toggle-admin", userController.toggleAdmin);
router.get("/admin/users", userController.getUsers);

// Contact submissions management
router.get("/admin/contact-us", userController.getContactSubmissions);
router.delete("/admin/contact-us/:id", userController.deleteContactSubmission);








//Contact-route(Not admin route)
router.post("/contact-user-page", contactController.postContact);
module.exports = router;
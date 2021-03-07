let express= require("express");
let router= express.Router();
let authentication= require("./../controller/authentication");
let likesController= require("./../controller/likesController");

router.route("/").post(authentication.protect, likesController.createLike).get(authentication.protect, likesController.getYourLikedBlogs);
router.route("/:blog_id").delete(authentication.protect, likesController.deleteLike);

module.exports = router;
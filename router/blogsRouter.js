let express= require("express");
let router= express.Router();
let authentication= require("./../controller/authentication");
let blogController= require("./../controller/blogsController");
const { route } = require("./userRouter");

router.use((req,res,next)=>{
    console.log("arrival time", new Date());
    next();
});

router.route("/").post(authentication.protect, blogController.uploadBlogPhotos, blogController.createBlog).get(blogController.getAllBlogs);

router.get("/search_blogs/:search", blogController.searchBlogs);
router.get("/latest_similar_blogs/:id", blogController.latestSimilarBlogs);
router.get("/get_my_blogs", authentication.protect, blogController.getMyBlogs);
router.route("/:blog_id").get(authentication.checkUser, blogController.getBlogDetails).patch(authentication.protect, blogController.uploadBlogPhotos, blogController.updateBlog);

module.exports= router;
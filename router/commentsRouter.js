let express= require("express");
let router= express.Router();
let authentication= require("./../controller/authentication");
let commentsController= require("./../controller/commentsController");

router.route("/").post(authentication.protect, commentsController.createComment);
router.route("/:comment_id").delete(authentication.protect, commentsController.deleteComment);
router.get("/:blog_id", commentsController.getBlogComments);

module.exports = router;
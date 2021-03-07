let express= require("express");
let cors= require("cors");
let cookieParser= require("cookie-parser");
let userRouter= require("./router/userRouter");
let blogRouter= require("./router/blogsRouter");
let likesRouter= require("./router/likesRouter");
let commentsRouter= require("./router/commentsRouter");

let app= express();

app.use(cors({origin: true, credentials: true}));

app.use(cookieParser());

// ${__dirname} refers to a cuurent directory always but ./ only sometimes refers to a current directory
// ./ refers to a current directory in case require() statements otherwise it depends on whether it was export or not

app.use(express.static("./public"));

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/likes", likesRouter);
app.use("/api/v1/comments", commentsRouter);


// express error handler middleware
app.use((err,req,res,next)=>{
    console.log(err);
    res.status(500).json({
        status: "fail",
        message: err.message
    })
})

module.exports= app;
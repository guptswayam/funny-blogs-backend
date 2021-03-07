let DB = require("./../server");
let {returnErr} = require("./../utils/error");
let async = require("async");
let multer= require("multer");
let cloudinary= require("./../utils/cloudinaryConfig");


const multerStorage= multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public/img/blogs");
    },
    filename:(req,file,cb)=>{
        //user-1234567gh6789-23456778.jpeg
        const type=file.mimetype.split("/")[1];
        const id=req.currentUser.id;
        cb(null,`userblog-${id}-${Date.now()}.${type}`);
    }
})

const multerFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith("image"))
        cb(null,true);
    else
        cb(new Error("Not an image. Please upload only images"),false);
}

const upload= multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadBlogPhotos= upload.fields([
    { name: "images", maxCount: 10},
    { name: "main_image", maxCount: 1}
]);

exports.createBlog = (req,res,next)=>{

    // that's how the data is coming
    /*let headingData = {
        title: "main heading",
        content: "main_content"
    };

    let subHeadingData= [
        {
            sub_head: "sub heading 1",
            sub_content: "sub content 1"
        },
        {
            sub_head: "sub heading 2",
            sub_content: "sub content 2"
        }
    ]*/

    if(req.files.images){
        req.body.images=req.files.images.map(el=>{
            return process.env.NODE_ENV=="development"?`http://127.0.0.1:5000/img/blogs/${el.filename}`:`https://funny-bloggers.herokuapp.com/img/blogs/${el.filename}`;
        })

        req.body.images= req.body.images.join("$!end!$");
    }

    if(req.files.main_image){
        req.body.main_image= process.env.NODE_ENV=="development"?`http://127.0.0.1:5000/img/blogs/${req.files.main_image[0].filename}`:`https://funny-bloggers.herokuapp.com/img/blogs/${req.files.main_image[0].filename}`;
    }


    let headingData= JSON.parse(req.body.main_heading);
    let subHeadingData= JSON.parse(req.body.sub_headings);
    let sub_headings_data = [];
    let sub_headings= [];

    subHeadingData.forEach(el=>{
        sub_headings_data.push(el.sub_content);
        sub_headings.push(el.sub_head);
    })

    let blog= {
        main_heading: headingData.title,
        main_heading_data: headingData.content,
        main_image: req.body.main_image,
        sub_headings: sub_headings.join("$!end!$"),
        sub_headings_data: sub_headings_data.join("$!end!$"),
        images: req.body.images,
        user_id: req.currentUser.id
    }

    const Q= "insert into blogs set ?";
    DB.query(Q, blog, (err, result)=>{
        if(err) returnErr(err, 400, res);
        else{
            // saving image to cloudinary because user uploaded images are lost from heroku file system
            cloudinary.uploads(req.files.main_image[0].path, result.insertId).then(result1=>{
                console.log(result1.url);
                DB.query("update blogs set main_image=? where id=?", [result1.url, result1.blog_id]);
            })        
            res.status(201).json({
                status: "success",
                data: blog
            })
        }
    })
}


exports.updateBlog=(req,res,next)=>{
    console.log(req.files.main_image);
    cloudinary.uploads(req.files.main_image[0].path, req.currentUser.id).then(result=>{
        console.log(result.url);
    })
    res.send("success");
}


exports.getAllBlogs= (req,res, next)=>{
    const Q= "select id,main_heading, main_image, main_heading_data, created_at, user_id from blogs order by created_at desc";
    DB.query(Q, (err,result, fields)=>{
        if(err) returnErr(err, 500, res);
        else{
            console.log("departure time", new Date());
            console.log(DB._allConnections.length);
            res.status(200).json({
                status: "success",
                data: result
            })
        }
    });
}

exports.latestSimilarBlogs = (req, res, next)=>{
    const Q= "select main_heading, id from blogs where id!=? order by created_at";
    DB.query(Q, req.params.id, (err,result, fields)=>{
        if(err) returnErr(err, 500, res);
        else{
            console.log("departure time", new Date());
            console.log(DB._allConnections.length);
            res.status(200).json({
                status: "success",
                data: result
            })
        }
    });
}

exports.getMyBlogs= (req, res, next)=>{
    const Q= "select id,main_heading, main_image, main_heading_data, created_at, user_id from blogs where user_id=? order by created_at desc"
    DB.query(Q, req.currentUser.id, (err,result, fields)=>{
        if(err) returnErr(err, 500, res);
        else{
            console.log("departure time", new Date());
            console.log(DB._allConnections.length);
            res.status(200).json({
                status: "success",
                data: result
            })
        }
    });
}

exports.searchBlogs= (req, res, next)=>{
    const Q= "select id,main_heading, main_image, main_heading_data, created_at, user_id from blogs where main_heading like ? order by created_at desc"
    DB.query(Q, `%${req.params.search}%`, (err,result, fields)=>{
        if(err) returnErr(err, 500, res);
        else{
            console.log("departure time", new Date());
            console.log(DB._allConnections.length);
            res.status(200).json({
                status: "success",
                data: result
            })
        }
    });
}


// this method is using multiple query statements it is the fastest way to get blogDetails
// this is using a single connection but it is using multiple query statements so it has no impact of pool or single connetion if one request is coming at a time
exports.getBlogDetails1= async (req,res,next)=>{
    let data={}
    const Q1= `select count(*) as no_of_likes,description,images, main_heading, sub_headings, blogs.created_at from blogs
                join likes
                    on blogs.id=likes.blog_id
                group by blogs.id
                having blogs.id=?;`
    const Q2=`select name, email from blogs
                join users
                    on blogs.user_id=users.id
                where blogs.id=?;`
    const Q3=`select comment_text, email,comments.created_at as created_at, name from blogs
            join comments
                on comments.blog_id=blogs.id
            join users
                on comments.user_id=users.id
            where blogs.id=?
            order by created_at desc;`;
        DB.query(Q1+Q2+Q3, [req.params.blog_id,req.params.blog_id,req.params.blog_id], (err1, result1, fields1)=>{
            if(err1) returnErr(err1,404,res);
            else{
                data.blog= result1[0][0];
                data.author= result1[1][0];
                data.comments= result1[2]
                console.log("departure time", new Date());
                        res.status(200).json({
                            status: "success",
                            data
                        })
            }
    })

    console.log("process time", new Date());
}


// this is the second fastest way only if we are using the pool connections beacuse it is opening multiple connections at a time and waiting for all three to complete using asyn.parallel()
exports.getBlogDetails= async (req,res,next)=>{
    let data={}
    const Q1= `select count(likes.created_at) as no_of_likes, main_heading_data, main_image, images, main_heading, sub_headings,sub_headings_data, blogs.created_at from blogs
                left join likes
                    on blogs.id=likes.blog_id
                group by blogs.id
                having blogs.id=?;`
    const Q2=`select name, email from blogs
                join users
                    on blogs.user_id=users.id
                where blogs.id=?;`
    const Q3=`select comment_text, email,comments.created_at as created_at, name from blogs
            join comments
                on comments.blog_id=blogs.id
            join users
                on comments.user_id=users.id
            where blogs.id=?
            order by created_at desc
            limit 5;`;

    const Q4= `select case when created_at is not null then "true" else "false" end as liked from likes where user_id=? and blog_id=?`;
    

    async.parallel({
        one: function(callback) {
            DB.query(Q1, req.params.blog_id, (err1, result1, fields1)=>{
                if(err1) throw err1;
                callback(null, result1[0]);
            })      
        },
        two: function(callback) {
            DB.query(Q2, req.params.blog_id,(err2,result2,fields2)=>{
                if(err2) throw err2;
                callback(null,result2[0]);
            })      
        },
        three: function(callback){
            DB.query(Q3, req.params.blog_id, (err3, result3, fields3)=>{
                callback(null,result3);
            })
        },
        four: function(callback){
            if(req.currentUser){
                DB.query(Q4, [req.currentUser.id, req.params.blog_id], (err4, result4, fields4)=>{
                    callback(null,result4[0]);
                })
            }
            else
                callback(null,undefined);
        }
    }, function(err, results) {
        // results is now equals to: {one: {}, two: {}, three: {}}
        if(results.two){
            console.log(results.one);
            if(results.one.sub_headings_data)
                results.one.sub_headings_data=results.one.sub_headings_data.split("$!end!$");
            if(results.one.sub_headings)
                results.one.sub_headings=results.one.sub_headings.split("$!end!$");
            if(results.one.images)
                results.one.images=results.one.images.split("$!end!$");
            data.blog=results.one;
            data.author= results.two;
            data.comments= results.three;
            data.liked= results.four;
            console.log("departure time", new Date());
            console.log(DB._allConnections.length);
        
            res.status(200).json({
                status: "success",
                data
            })
        }
        else{
            returnErr(new Error("this blog_id not exist"),404, res);
        }
    })

    console.log("process time", new Date());
}


// this is worst and slowest method because it is using nested callbacks and next callback is waiting for the completion of previous callback
exports.getBlogDetails2=(req, res, next)=>{
    let data={}
    const Q1= `select count(*) as no_of_likes,description,images, main_heading, sub_headings, blogs.created_at from blogs
                join likes
                    on blogs.id=likes.blog_id
                group by blogs.id
                having blogs.id=?;`
    const Q2=`select name, email from blogs
                join users
                    on blogs.user_id=users.id
                where blogs.id=?;`
    const Q3=`select comment_text, email,comments.created_at as created_at, name from blogs
            join comments
                on comments.blog_id=blogs.id
            join users
                on comments.user_id=users.id
            where blogs.id=?
            order by created_at desc;`;

    DB.query(Q1, req.params.blog_id, (err1, result1, fields1)=>{
        data.blog=result1[0];
        DB.query(Q2, req.params.blog_id,(err2,result2,fields2)=>{
            if(err2) throw err2;
            data.author=result2[0];
            DB.query(Q3, req.params.blog_id, (err3, result3, fields3)=>{
                data.comments= result3;
                console.log("departure time", new Date());
                res.status(200).json({
                    status: "success",
                    data
                })
            })

        })

    })
}
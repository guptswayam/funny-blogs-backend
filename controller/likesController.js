let DB= require("./../server");
let {returnErr} = require("./../utils/error");

exports.createLike= (req,res,next)=>{
    let like= {
        blog_id: req.body.blog_id,
        user_id: req.currentUser.id
    }

    const Q = "insert into likes set ?";
    DB.query(Q,like,(err, result)=>{
        if(err) returnErr(err, 400, res);
        else{
            res.status(200).json({
                status: "success",
                data: like
            })
        }
    });

}

exports.deleteLike= (req, res, next)=>{
    const Q="delete from likes where user_id=? and blog_id=?";
    DB.query(Q, [req.currentUser.id, req.params.blog_id], (err, result)=>{
        if(err) returnErr(err, 404, res);
        else{
            res.status(200).json({
                status: "success"
            })
        }
    });
}

exports.getYourLikedBlogs = (req, res, next)=>{
    const Q= `select blogs.id as id,main_heading, main_image, main_heading_data, blogs.created_at from blogs
                join likes
                    on likes.blog_id=blogs.id
                where likes.user_id=?
                order by likes.created_at`;
    DB.query(Q, req.currentUser.id, (err, result, fields)=>{
        if(err) returnErr(err, 404, res);
        else{
            res.status(200).json({
                status: "success",
                data: result
            })
        }
    });
}
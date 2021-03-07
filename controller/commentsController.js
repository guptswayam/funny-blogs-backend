let DB= require("./../server");
let {returnErr} = require("./../utils/error");

exports.createComment= (req,res,next)=>{
    let comment= {
        blog_id: req.body.blog_id,
        user_id: req.currentUser.id,
        comment_text: req.body.comment_text
    }

    const Q = "insert into comments set ?";
    DB.query(Q,comment,(err, result)=>{
        if(err) returnErr(err, 400, res);
        else{
            res.status(200).json({
                status: "success",
                data: comment
            })
        }
    });

}

exports.deleteComment = (req, res, next)=>{
    const Q="delete from comments where id=?";
    DB.query(Q, req.params.comment_id, (err, result)=>{
        if(err) returnErr(err, 404, res);
        else{
            res.status(204).json({
                status: "success"
            })
        }
    });
}

exports.getBlogComments= (req,res,next)=>{
    if(!req.query.limit)
        req.query.limit = 5;
    if(!req.query.page)
        req.query.page = 1;

    const Q =  `select comment_text, comments.created_at,name  from comments
                join blogs
                    on blogs.id=comments.blog_id
                join users
                    on comments.user_id=users.id
                where blogs.id=?
                order by comments.created_at desc
                limit ?`;

    DB.query(Q, [req.params.blog_id, req.query.page*req.query.limit], (err, result, fields)=>{
        if(err) returnErr(err, 404, res);
        else
            res.status(200).json({
                status: "success",
                data: result.slice((req.query.page-1)*req.query.limit)
            })
    })
}
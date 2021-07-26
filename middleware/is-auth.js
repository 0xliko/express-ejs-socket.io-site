module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  if(req.session.user.level>0){
     //console.log(req.url)
  }
  next();
}
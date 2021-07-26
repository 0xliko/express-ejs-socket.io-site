const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const csrf = require('csurf');
var bodyParser = require('body-parser')
const compression = require('compression')

const errorController = require('./controllers/errorController');
const usersRoutes = require('./routes/userRoute');
const categoryRoutes = require('./routes/categoryRoute');
const checkRoutes = require('./routes/checkRoute');

const dashboardRoutes = require('./routes/dashboardRoute');
const route_auth = require('./routes/authRoute');
const fileUpload = require('express-fileupload');
const http = require("http");
require("./config");
const User = require('./models/user');
const engine = require('ejs-locals');


const app = express();
var server = http.createServer(app);
const io = require('socket.io').listen(server);

SOCKETSERVER = io;

app.use(fileUpload());
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();
app.locals.baseURL = BASE_URL;

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', 'views');

/*app.use(helmet());*/




app.use(compression());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    store: store // store sessions in MongoDB with connect-mongodb-session
}));
app.use(flash());
app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    app.locals.menus = req.session.menus;
    app.locals.user = req.session.user;
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {            
            if (!user) {
                return next();
            }
            // set the user key in the request object to the model user we get from mongoose
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use(route_auth);

app.use(dashboardRoutes);
app.use(usersRoutes);
app.use(categoryRoutes);
app.use(checkRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error)
    res.status(500).render('500', {
        pageTitle: 'Error',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose
    .connect(MONGODB_URI,{ useNewUrlParser: true })
    .then(result => {
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`App listening on port ${PORT}.`);
        });
    })
    .catch(err => console.log(err));

io.on('connect',function(socket){
   socket.on("join",function(room){
       socket.join(room)
   })
});
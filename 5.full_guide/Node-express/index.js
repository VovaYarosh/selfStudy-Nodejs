const express = require('express')
const path = require('path')
const csrf = require('csurf')
const flash = require('connect-flash')
const mongoose = require('mongoose')
const helmet = require('helmet')
const compression = require('compression')
const exphbs = require('express-handlebars')
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session)

const homeRoutes = require('./routes/home')
const cardRoutes = require('./routes/card')
const addRoutes = require('./routes/add')
const ordersRoutes = require('./routes/orders')
const coursesRoutes = require('./routes/courses')
const authRoutes = require('./routes/auth')
const profileRoutes = require('./routes/profile')
const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')
const errorHandler = require('./middleware/error')
const filemiddleware = require('./middleware/file')
const keys = require('./keys')

const app = express()

const hbs = exphbs.create({
    defaultLayout:'main',
    extname:'hbs',
    helpers:require('./utils/hbs-helpers')
})
const store = new  MongoStore({
    collection: "session",
    uri: keys.MONGODB_URI

})

app.engine('hbs',hbs.engine)
app.set('view engine','hbs')
app.set('views','views')

app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store
}))
app.use(filemiddleware.single('avatar'))
app.use(csrf())
app.use(flash())
app.use(helmet())
app.use(compression())
app.use(varMiddleware)
app.use(userMiddleware)

app.use('/',homeRoutes)
app.use('/add',addRoutes)
app.use('/courses',coursesRoutes)
app.use('/card',cardRoutes)
app.use('/orders',ordersRoutes)
app.use('/auth', authRoutes)
app.use('/profile',profileRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000

async function start(){
    try{
        await mongoose.connect(keys.MONGODB_URI,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        app.listen(PORT,()=>{ 
            console.log(`server is running on port ${PORT}`)
        })
    }catch(e){
        console.log(e)
    }
    
}

start()




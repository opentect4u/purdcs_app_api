// MODULE & VARIABLE DECLIRATION
const express = require('express'),
    app = express(),
    port = process.env.PORT || 3001;
// END

// TO ACCEPT ALL DATA FROM CLIENT SIDE USING GET/POST REQUEST
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// END

// ROUTERS INITIALIZATION
const { salRouter } = require('./router/salaryRouter');
const { apiRouter } = require('./router/apiRouter');
const { appApiRouter } = require('./router/appApiRouter');
// END

app.get('/', (req, res) => {
    res.send('Welcome')
})

// USE ROUER FOR SPECIFIC URL
app.use('/sal', salRouter)
app.use('/api', apiRouter)
app.use('/api', appApiRouter)
// END

// SERVER LISTNING
app.listen(port, (err) => {
    if (err) console.log(err);
    else console.log(`App is running at port ${port}`);
})
// END
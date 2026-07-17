const express = require('express'),
app = express(),
port = process.env.PORT || 3000,
http = require('http'),
socketIO = require('socket.io'),
// https = require('https'),
// { Server } = require('socket.io'),
ejs = require("ejs"),
session = require("express-session");

require("dotenv").config();

var fs = require('fs'),
path = require('path');

// const options = {
//     key: fs.readFileSync(path.join(__dirname, 'ssl_credential/Privatekey.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'ssl_credential/app_synergicbanking_in.pem')),
//     ca: [
//         fs.readFileSync(path.join(__dirname, 'ssl_credential/DigiCertCA.crt')),
//         fs.readFileSync(path.join(__dirname, 'ssl_credential/My_CA_Bundle.crt'))
//     ]
//   };

  // TO ACCEPT ALL DATA FROM CLIENT SIDE USING GET/POST REQUEST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// END

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/assets"));

app.set("view engine", "ejs");

app.use(
  session({
    secret: "PURDCS",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
    },
  })
);

app.use((req, res, next) => {
  res.locals.active = req.path.split("/")[2];
  // console.log(res.locals.active);
  res.locals.message = req.session.message;
  req.io = io;
  delete req.session.message;
  next();
});

// ROUTERS INITIALIZATION
const { salRouter } = require("./router/salaryRouter");
const { appApiRouter } = require("./router/appApiRouter");
const { SendNotification } = require('./controller/masterController');
const { Notification_cnt } = require('./controller/masterController');
const { UpdateNotification } = require('./controller/masterController');
const { adminRouter } = require("./router/adminRouter");
// END



// USE ROUER FOR SPECIFIC URL
app.use("/sal", salRouter);
// app.use("/api", apiRouter);
app.use("/api", appApiRouter);
app.use("/admin", adminRouter);
// app.use('/bccs', bccsApkApiRouter);
// app.use('/bccs_admin', bccsAdminRouter);
// END

app.get('/', (req, res) => {
  var bcrypt = require("bcrypt")
  var password = bcrypt.hashSync('3118', 10);
  console.log(password);
    res.send('Helow World1');
})

// https.createServer(options, function (req, res) {
//     res.writeHead(200);
//     res.end("hello world\n");
//   }).listen(3000);

// var server = https.createServer(options, app);
// const io = new Server(server);

var server = http.createServer(app);
const io = socketIO(server);

io.on('connection', async function (socket) {
    console.log(`Connected succesfully to the socket ... ${socket.id}`);
    socket.on('notification', async (data) => {
      console.log(socket.id + ' in notification');
      var res_dt = await SendNotification();
      socket.emit('notification', res_dt);
    })
	socket.on('notification_cnt', async (data) => {
     // console.log(socket.id + ' in notification');
      var res_dt = await Notification_cnt();
    //  var res_dt = 'test data';
      socket.emit('notification_cnt', res_dt);
    })
	socket.on('redu_noti_cnt', async (data) => {
    //  console.log(socket.id + ' in notification');
      var res_dt = await UpdateNotification(data);
		 var res_dt_send = await SendNotification();
      socket.emit('notification', res_dt_send);
		// var res_dt = data;
      socket.emit('redu_noti_cnt', res_dt);
    })
    // socket.on('notification', (data) => {
    //   var sql = `SELECT sl_no, ardb_id, narration, send_user_id user_id, created_by, created_dt FROM td_notification WHERE ardb_id = "${data.ardb_id}" AND send_user_id = "${data.user_id}" ORDER BY DATE(created_dt) DESC LIMIT ${data.max}`
    //   db.query(sql, (err, result) => {
    //     // console.log(result);
    //     if (err) res_dt = { suc: 0, msg: err };
    //     else res_dt = { suc: 1, msg: result };
    //     socket.emit('notification', res_dt);
    //   })
    // });
  })

// server.listen(port);

server.listen(port, (err) => {
    if(err) throw err;
    else console.log(`App is running at port ${port}`);
})
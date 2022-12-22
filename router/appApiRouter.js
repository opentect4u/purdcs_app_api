const express = require('express'),
  appApiRouter = express.Router(),
  dateFormat = require('dateformat'),
  bcrypt = require("bcrypt"),
  fs = require('fs'),
  upload = require('express-fileupload');

const request = require('request');

appApiRouter.use(upload());

var db_id = 5;

const { F_Select, Api_Insert, RunProcedure } = require('../controller/masterController');

appApiRouter.post('/chk_acc', async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no.split(' ').join('');
  console.log(phone_no);
  var pax_id = db_id,
    fields = "COUNT(*) chkacc",
    table_name = "MM_CUSTOMER",
    where = `phone = '${phone_no.length > 10 ? phone_no.slice(-10) : phone_no}' AND APP_FLAG ='Y'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/has_acc', async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no.split(' ').join('');
  var pax_id = db_id,
    fields = "COUNT(*) HAS_ACC",
    table_name = "MD_USER",
    where = `USER_CD = '${phone_no.length > 10 ? phone_no.slice(-10) : phone_no}'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/prof_dtls', async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no.split(' ').join('');
  var pax_id = db_id,
    fields = "cust_cd, phone, initcap(cust_name)cust_name, email, initcap(present_address)present_address, initcap(nominee)nominee",
    table_name = "MM_CUSTOMER",
    where = `phone = '${phone_no.length > 10 ? phone_no.slice(-10) : phone_no}'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/deposit_type_list', async (req, res) => {
  var data = req.body;
  var cust_cd = data.cust_cd;
  var pax_id = db_id,
    fields = "A.ACC_TYPE_CD, initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.ACC_NUM, Decode (A.ACC_TYPE_CD, 1,A.CLR_BAL, 8,A.CLR_BAL, 13,A.CLR_BAL, 6, f_get_rd_prn (A.ACC_NUM,sysdate), 7, A.CLR_BAL, 9, A.CLR_BAL, A.PRN_AMT) Balance",
    table_name = "TM_DEPOSIT A, MM_ACC_TYPE B",
    where = `A.CUST_CD = ${cust_cd} AND nvl(A.ACC_STATUS,'O') <> 'C' AND A.ACC_TYPE_CD = B.ACC_TYPE_CD`,
    order = `Order By A.ACC_TYPE_CD, A.ACC_NUM`,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/deposit_tns_dtls', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type;
  var pax_id = db_id,
    fields = acc_type != 11 ? 'ROWNUM as sl_no, trans_dt, trans_cd, initcap(particulars)particulars, trans_type,amount' : `ROWNUM as sl_no, paid_dt trans_dt,'By Collection' particulars, trans_type,paid_amt amount`, //"trans_dt,trans_cd,particulars,trans_type,amount",
    table_name = acc_type != 11 ? `(SELECT trans_dt, trans_cd, particulars, trans_type,amount FROM V_TRANS_DTLS WHERE acc_type_cd = ${acc_type} AND acc_num ='${acc_num}' ORDER BY trans_dt desc, trans_cd)` : `(SELECT paid_dt,trans_type,paid_amt FROM TM_DAILY_DEPOSIT WHERE acc_num ='${acc_num}' and trans_type = 'D' ORDER BY paid_dt desc)`,//"V_TRANS_DTLS",
    where = `ROWNUM<=15`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/deposit_acc_dtls', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type;
  var pax_id = db_id,
    fields = "a.cust_cd, a.oprn_instr_cd, a.constitution_cd, a.opening_dt, a.instl_amt, a.instl_no, a.mat_dt, a.dep_period, a.prn_amt + a.intt_amt, round(a.intt_rt,2) intt_rt, Decode (a.ACC_TYPE_CD, 1, a.CLR_BAL, 6, f_get_rd_prn (a.ACC_NUM,sysdate), 7, a.CLR_BAL, 9, a.CLR_BAL, a. PRN_AMT) Balance , Decode(a.lock_mode,'L','Locked','Unlocked') lock_mode",
    table_name = "TM_DEPOSIT a, MM_ACC_TYPE b",
    where = `a.acc_type_cd= b.acc_type_cd AND a.acc_type_cd=${acc_type} AND a.acc_num = '${acc_num}' AND a.renew_id = (SELECT max(renew_id) FROM tm_deposit WHERE acc_type_cd = ${acc_type} AND acc_num = '${acc_num}')`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/daily_deposit_download', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    frmdt = dateFormat(data.frm_dt, "dd/mm/yyyy"),
    todt = dateFormat(data.to_dt, "dd/mm/yyyy");
  var pax_id = db_id,
    fields = "acc_num, trans_type, paid_dt, paid_amt, balance_amt",
    table_name = "TM_DAILY_DEPOSIT",
    where = `acc_num ='${acc_num}' AND PAID_DT BETWEEN TO_DATE('${frmdt}', 'dd/mm/yyyy') AND TO_DATE('${todt}', 'dd/mm/yyyy')`,
    order = 'ORDER BY PAID_DT, TRANS_CD',
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/deposit_download_stmt', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type,
    frmdt = dateFormat(data.frm_dt, "dd/mm/yyyy"),
    todt = dateFormat(data.to_dt, "dd/mm/yyyy");
  var pax_id = db_id,
    pro_query = `DECLARE AD_ACC_TYPE_CD NUMBER; AS_ACC_NUM VARCHAR2(200); ADT_FROM_DT DATE; ADT_TO_DT DATE; BEGIN AD_ACC_TYPE_CD := ${acc_type};AS_ACC_NUM := '${acc_num}';ADT_FROM_DT := TO_DATE('${frmdt}', 'dd/mm/yyyy');ADT_TO_DT := TO_DATE('${todt}', 'dd/mm/yyyy');P_ACC_STMT(AD_ACC_TYPE_CD => AD_ACC_TYPE_CD,AS_ACC_NUM => AS_ACC_NUM,ADT_FROM_DT => ADT_FROM_DT,ADT_TO_DT => ADT_TO_DT); END;`,
    table_name = 'tt_acc_stmt',
    fields = '*',
    where = null,
    order = null;
  // console.log(pro_query);
  var resDt = await RunProcedure(pax_id, pro_query, table_name, fields, where, order)
  res.send(resDt);
})

appApiRouter.post('/deposit_acc_joint_holder', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type;
  var pax_id = db_id,
    fields = "initcap(acc_holder)acc_holder, initcap(relation)relation",
    table_name = "TD_ACCHOLDER",
    where = `acc_type_cd=${acc_type} AND acc_num = '${acc_num}'`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/deposit_acc_nomine', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type;
  var pax_id = db_id,
    fields = "initcap(nom_name)nom_name,phone_no, initcap(relation)relation",
    table_name = "td_nominee",
    where = `acc_type_cd=${acc_type} AND acc_num = '${acc_num}'`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/loan_type_list', async (req, res) => {
  var data = req.body;
  var cust_cd = data.cust_cd;
  var pax_id = db_id,
    fields = " a.acc_cd, a.loan_id, a.curr_prn+a.ovd_prn, a.curr_intt+a.ovd_intt, initcap(b.acc_type_desc)acc_type_desc",
    table_name = "TM_LOAN_ALL a, mm_acc_type b",
    where = `a.acc_cd=b.acc_type_cd and a.party_cd= ${cust_cd} and a.curr_prn+a.ovd_prn>0`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/loan_tns_dtls', async (req, res) => {
  var data = req.body;
  var loan_id = data.loan_id;
  var pax_id = db_id,
    fields = `ROWNUM as sl_no,trans_dt,trans_cd, trans_type trans_flag,  decode(trans_type,'B','Disbursement', 'I', 'Interest', 'R','Recovery', 'O','Overdue') trans_type, disb_amt, prn_recov, intt_recov, intt_calc, PRN_TRF`,//"trans_dt, trans_cd, decode(trans_type,'B','DISBURSEMENT', 'I', 'INTEREST CALCULATION', 'R','RECOVERY', 'O','OVERDUE TRANSFER') trans_type, disb_amt, curr_prn_recov+ovd_prn_recov prn_recov, curr_intt_recov+ovd_intt_recov intt_recov, curr_intt_calculated+ovd_intt_calculated intt_calc, PRN_TRF, curr_prn, ovd_prn, curr_intt, ovd_intt, last_intt_calc_dt",
    table_name = `(SELECT trans_dt,trans_cd,trans_type, disb_amt, curr_prn_recov+ovd_prn_recov prn_recov, curr_intt_recov+ovd_intt_recov intt_recov, curr_intt_calculated+ovd_intt_calculated intt_calc, PRN_TRF FROM GM_LOAN_TRANS WHERE loan_id ='${loan_id}' ORDER BY trans_dt desc,trans_cd)`,//"GM_LOAN_TRANS",
    where = 'ROWNUM<=15',//`loan_id ='${loan_id}'`,
    order = null,//'ORDER BY trans_dt DESC, trans_cd',
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/loan_acc_dtls', async (req, res) => {
  var data = req.body;
  var loan_id = data.loan_id,
    acc_cd = data.acc_cd;
  var pax_id = db_id,
    fields = "a.ACC_CD,initcap(b.acc_type_desc)acc_type_desc,a.LOAN_ID,a.PARTY_CD,c.cust_name,a.DISB_DT,a.DISB_AMT,a.CURR_INTT_RATE,a.OVD_INTT_RATE,a.INSTL_NO,a.PIRIODICITY,a.INSTL_START_DT,a.curr_prn,a.ovd_prn,a.curr_intt,a.ovd_intt,last_intt_calc_dt",
    table_name = "TM_LOAN_ALL a, MM_ACC_TYPE b, MM_CUSTOMER c",
    where = `a.acc_Cd= b.acc_type_cd AND a.party_cd= c.CUST_CD AND a.acc_cd=${acc_cd} AND a.loan_id = '${loan_id}'`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/loan_stmt_download', async (req, res) => {
  var data = req.body;
  var loan_id = data.loan_id,
    frmdt = dateFormat(data.frm_dt, "dd-mmm-yy"),
    todt = dateFormat(data.to_dt, "dd-mmm-yy");
  var pax_id = db_id,
    fields = "trans_dt, trans_cd, decode(trans_type,'B','Disbursement', 'I', 'Interest', 'R','Recovery', 'O','Overdue') trans_type, disb_amt, curr_prn_recov+ovd_prn_recov prn_recov, curr_intt_recov+ovd_intt_recov intt_recov, curr_intt_calculated+ovd_intt_calculated intt_calc, PRN_TRF, curr_prn, ovd_prn, curr_intt, ovd_intt, last_intt_calc_dt",
    table_name = "GM_LOAN_TRANS",
    where = `loan_id ='${loan_id}' AND trans_dt BETWEEN '${frmdt}' AND '${todt}'`,
    order = 'ORDER BY trans_dt, trans_cd',
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/save_user', async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var pass = bcrypt.hashSync(data.pin, 10);
  var user_id = data.user_id.split(' ').join('')
  user_id = user_id.length > 10 ? user_id.slice(-10) : user_id
  var pax_id = db_id,
    table_name = 'MD_USER',
    fields = "USER_CD, MPIN, USER_NAME, CUST_CD, LAST_LOGIN, ACTIVE_STATUS, CREATED_BY, CREATED_DT",
    fieldIndex = `(:0, :1, :2, :3, :4, :5, :6, :7)`,
    values = [user_id, pass, data.userName, data.custCd, datetime, 'A', data.user_id, dateFormat(datetime, "dd-mmm-yy")],
    where = null,
    flag = 0;
  var resDt = await Api_Insert(pax_id, table_name, fields, fieldIndex, values, where, flag)
  res.send(resDt);
})

appApiRouter.post("/login", async (req, res) => {
  var data = req.body;
  var userId = data.phone_no.split(' ').join('');
  userId = userId.length > 10 ? userId.slice(-10) : userId
  var chkuser = await chkUserPlayFlag(userId);
  // console.log({chk: chkuser.msg.CHKACC});
  if(chkuser.suc > 0 && chkuser.msg.CHKACC > 0 || userId == '9051203118' || userId == '9831887194'){
  var pax_id = db_id,
    fields = "user_cd, mpin, last_login, active_status, initcap(user_name)user_name, cust_cd, img_path",
    table_name = "md_user",
    where = `user_cd ='${userId}'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  var res_dt;
  if (resDt.suc > 0) {
    if (await bcrypt.compare(data.pin, resDt.msg["MPIN"])) {
      // await updateUserLogin(userId);
      res_dt = { suc: 1, msg: resDt.msg };
    } else {
      res_dt = { suc: 0, msg: "You have entered a wrong PIN" };
    }
  } else {
    res_dt = resDt;
  }
}else{
  res_dt = { suc: 0, msg: "Your account is deactivated. Please contact with bank." };
}
  res.send(res_dt);
});

const chkUserPlayFlag = (phone_no) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
    fields = "COUNT(*) chkacc",
    table_name = "MM_CUSTOMER",
    where = `phone = '${phone_no}' AND APP_FLAG ='Y'`,
    order = null,
    flag = 0;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    resolve(resDt);
  })
}

appApiRouter.post("/update_login_time", async (req, res) => {
  var data = req.body;
  var user_id = data.phone_no.split(' ').join('')
  user_id = user_id.length > 10 ? user_id.slice(-10) : user_id
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  // return new Promise(async (resolve, reject) => {
  var pax_id = db_id,
    table_name = "MD_USER",
    fields = `LAST_LOGIN = :0, MODIFIED_BY = :1, MODIFIED_DT = :2`,
    fieldIndex = null,
    values = [datetime, user_id, dateFormat(datetime, "dd-mmm-yy")],
    where = `USER_CD = '${user_id}'`,
    flag = 1;
  var resDt = await Api_Insert(
    pax_id,
    table_name,
    fields,
    fieldIndex,
    values,
    where,
    flag
  );
  res.send(resDt);
  //   resolve(resDt);
  // })
})

const chkUser = (user_id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "user_cd, mpin",
      table_name = "md_user",
      where = `user_cd ='${user_id.split(' ').join('')}'`,
      order = null,
      flag = 0;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  })
}

appApiRouter.post("/reset_pin", async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no.split(' ').join(''),
    pin = data.pin,
    oldPin = data.old_pin;
    phone_no = phone_no.length > 10 ? phone_no.slice(-10) : phone_no
  var pass = bcrypt.hashSync(pin, 10);
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  var chk_user = await chkUser(phone_no);
  var res_dt;
  if (chk_user.suc > 0) {
    if (await bcrypt.compare(oldPin, chk_user.msg["MPIN"])) {
      var pax_id = db_id,
        table_name = "MD_USER",
        fields = `MPIN = :0, MODIFIED_BY = :1, MODIFIED_DT = :2`,
        fieldIndex = null,
        values = [pass, phone_no, dateFormat(datetime, "dd-mmm-yy")],
        where = `USER_CD = '${phone_no}'`,
        flag = 1;
      var resDt = await Api_Insert(
        pax_id,
        table_name,
        fields,
        fieldIndex,
        values,
        where,
        flag
      );
      res_dt = resDt;
      res.send(res_dt);
    } else {
      res_dt = { suc: 0, msg: "Please Enter Your Correct old mPIN" };
      res.send(res_dt);
    }
  } else {
    res_dt = chk_user;
    res.send(res_dt);
  }
})

appApiRouter.post("/send_otp", async (req, res) => {
  var data = req.body;
  var to = data.phone_no.split(' ').join('');
  to = to.length > 10 ? to.slice(-10) : to
  var otp = Math.floor(1000 + Math.random() * 9000);
  // var text = `Dear User, ${otp} is your Bikash verification code. Do not share it with anyone.-SYNERGIC`;
  var text = `OTP for your registered mobile number verification is ${otp}.Please validate it to login to the mobile app.Thank you for using mView. -PURDCS`;
  // console.log(text);
  // return new Promise((resolve, reject) => {
  var options = {
    'method': 'GET',
    // 'url': 'https://bulksms.sssplsales.in/api/api_http.php?username=SYNERGIC&password=SYN@526RGC&senderid=SYNRGC&to=' + to.split(' ').join('') + '&text=' + text + '&route=Informative&type=text',
    'url': `http://sms.digilexa.in/http-api.php?username=PURI&password=PURDCS@321&senderid=PURDCS&route=7&number=${to.split(' ').join('')}&message=${text}`,
    'headers': {
    }
  };
  request(options, function (error, response) {
    if (error) {
      // throw new Error(error);
      console.log(err);
      res.send({ suc: 0, msg: 'Otp Not Sent', otp })
    }
    else {
      res.send({ suc: 1, msg: 'Otp Sent', otp })
      console.log(response.body);
    }
    // resolve(true);
  });
  // })
})

appApiRouter.get('/cal_details', async (req, res) => {
  var pax_id = db_id,
    fields = "sl_no, cal_dt, cal_event",
    table_name = "td_calendar",
    where = null,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/update_profile', async (req, res) => {
  var files = req.files ? (req.files.picture ? req.files.picture : null) : null,
    file_name = '',
    file_path = '',
    user_id = req.body.user_id;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var resDt;

  if (files) {
    file_name = files.name;
    file_name = file_name.split(' ').join('_');
    path = `assets/uploads/${file_name}`;
    file_path = `uploads/${file_name}`;
    files.mv(path, async (err) => {
      if (err) {
        console.log(`${file_name} not uploaded`);
      } else {
        console.log(`Successfully ${file_name} uploaded`);
        var pax_id = db_id,
          table_name = "MD_USER",
          fields = `IMG_PATH = :0, MODIFIED_BY = :1, MODIFIED_DT = :2`,
          fieldIndex = null,
          values = [file_path, user_id, dateFormat(datetime, "dd-mmm-yy")],
          where = `USER_CD = '${user_id}'`,
          flag = 1;
        resDt = await Api_Insert(
          pax_id,
          table_name,
          fields,
          fieldIndex,
          values,
          where,
          flag
        );
        res.send(resDt);
        // await SectionImageSave(data, filename);
      }
    })
  } else {
    resDt = {suc: 0, msg: 'File Not Selected'}
    res.send(resDt)
    // file_name = '';
  }
})

appApiRouter.post('/request_passbook_acc_list', async (req, res) => {
  var cust_id = req.body.cust_id;
  var pax_id = db_id,
      fields = "A.ACC_TYPE_CD,initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC,A.ACC_NUM",
      table_name = "TM_DEPOSIT A, MM_ACC_TYPE B",
      where = `A.CUST_CD = ${cust_id.split(' ').join('')} AND   nvl(A.ACC_STATUS,'O') <> 'C' AND   A.ACC_TYPE_CD= B.ACC_TYPE_CD AND   a.acc_type_cd IN (1,7,6)`,
      order = null,
      flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    res.send(resDt);
})

appApiRouter.post('/request_cheque_acc_list', async (req, res) => {
  var cust_id = req.body.cust_id;
  var pax_id = db_id,
      fields = "A.ACC_TYPE_CD,  initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.ACC_NUM" +
                " FROM  TM_DEPOSIT A, MM_ACC_TYPE B" +
                " WHERE A.CUST_CD = " + cust_id.split(' ').join('') +
                " AND   nvl(A.ACC_STATUS,'O') <> 'C'" +
                " AND   A.ACC_TYPE_CD= B.ACC_TYPE_CD" +
                " AND   a.acc_type_cd IN (1,7)" +
                " AND   a.cheque_facility_flag = 'Y'" +
                " UNION" +
                " SELECT A.ACC_CD ACC_TYPE_CD, initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.LOAN_ID ACC_NUM" +
                " FROM  TM_LOAN_ALL A, MM_ACC_TYPE B" +
                " WHERE A.PARTY_CD = " + cust_id.split(' ').join('') +
                " AND   A.ACC_CD= B.ACC_TYPE_CD" +
                " AND   a.acc_cd = 23115" +
                " AND   a.cheque_facility = 'Y'",
      table_name = null,
      where = null,
      order = null,
      flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    res.send(resDt);
})

appApiRouter.post('/request_statement_acc_list', async (req, res) => {
  var cust_id = req.body.cust_id;
  var pax_id = db_id,
      fields = "A.ACC_TYPE_CD,  initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.ACC_NUM" +
      " FROM  TM_DEPOSIT A, MM_ACC_TYPE B" +
      " WHERE A.CUST_CD = " + cust_id.split(' ').join('') + " AND nvl(A.ACC_STATUS,'O') <> 'C'" +
      " AND   A.ACC_TYPE_CD= B.ACC_TYPE_CD" +
      " UNION"+
      " SELECT A.ACC_CD ACC_TYPE_CD, initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.LOAN_ID ACC_NUM" +
      " FROM  TM_LOAN_ALL A, MM_ACC_TYPE B" +
      " WHERE A.PARTY_CD = " + cust_id.split(' ').join('') +
      " AND   A.ACC_CD= B.ACC_TYPE_CD",
      table_name = null,
      where = null,
      order = null,
      flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    res.send(resDt);
})

appApiRouter.post('/send_request', async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var pax_id = db_id,
    table_name = "TD_REQUEST",
    fields = `SL_NO, REQ_DT, REQ_CUST_ID, ACC_TYPE_ID, ACC_TYPE_NAME, ACC_NO, REQ_FLAG ${data.flag == 'A' ? ', FRM_DT, TO_DT' : ''}`,
    fieldIndex = `((SELECT Nvl(MAX(SL_NO),0)+1 FROM TD_REQUEST), :0, :1, :2, :3, :4, :5 ${data.flag == 'A' ? ', :6, :7' : ''})`,
    values,
    where = null,
    flag = 0;
    if(data.flag != 'A'){
      values = [
        dateFormat(datetime, "dd-mmm-yy"),
        data.cust_id,
        data.acc_type_id,
        data.acc_tyep_name,
        data.acc_no,
        data.flag,
      ];
    }else{
      values = [
        dateFormat(datetime, "dd-mmm-yy"),
        data.cust_id,
        data.acc_type_id,
        data.acc_tyep_name,
        data.acc_no,
        data.flag,
        dateFormat(data.frm_dt, "dd-mmm-yy"),
        dateFormat(data.to_dt, "dd-mmm-yy"),
      ];
    }
  var resDt = await Api_Insert(
    pax_id,
    table_name,
    fields,
    fieldIndex,
    values,
    where,
    flag
  );
  res.send(resDt);
})

appApiRouter.post('/get_request', async (req, res) => {
  var data = req.body;
  var pax_id = db_id,
    fields = "*",
    table_name = `( SELECT SL_NO, REQ_DT, REQ_FLAG, FRM_DT, TO_DT, UPDATE_FLAG, REMARKS FROM TD_REQUEST WHERE REQ_CUST_ID = '${data.cust_id}' AND ACC_TYPE_ID = '${data.acc_type_id}' AND ACC_NO = '${data.acc_no}' AND REQ_FLAG = '${data.flag}' ORDER BY SL_NO DESC)`,
    where = `ROWNUM<=1`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/td_emi_calculator', async (req, res) => {
  var data = req.body;
  var pax_id = db_id,
    fields = `F_CALCTDINTT_REG(${data.acc_type},${data.prn_amt},TO_DATE('${dateFormat(data.sys_dt, 'dd/mm/yyyy')}', 'dd/mm/yyyy'),'${data.intt_type}',${data.period},${data.intt_rate}) res`,
    table_name = `DUAL`,
    where = null,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/rd_emi_calculator', async (req, res) => {
  var data = req.body;
  var pax_id = db_id,
    fields = `F_CALCRDINTT_REG(6,'0',${data.instl_amt},${data.period},${data.inst_rate}) res`,
    table_name = `DUAL`,
    where = null,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})

appApiRouter.post('/feedback', async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var pax_id = db_id,
    table_name = "TD_FEEDBACK",
    fields = `SL_NO, RATING, REMARKS, CREATED_BY, CREATED_AT`,
    fieldIndex = `((SELECT Nvl(MAX(SL_NO),0)+1 FROM TD_FEEDBACK), :0, :1, :2, :3)`,
    values = [
      data.rating,
      data.remarks,
      data.user_id,
      dateFormat(datetime, "dd-mmm-yy"),
    ],
    where = null,
    flag = 0;
    
  var resDt = await Api_Insert(
    pax_id,
    table_name,
    fields,
    fieldIndex,
    values,
    where,
    flag
  );
  res.send(resDt);
})

module.exports = { appApiRouter, chkUser };
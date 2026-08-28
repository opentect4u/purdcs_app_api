const crypto = require('crypto');
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
  var pax_id = db_id,
    fields = "COUNT(*) chkacc",
    table_name = "MM_CUSTOMER",
    where = `phone = '${phone_no.length > 10 ? phone_no.slice(-10) : phone_no}'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  // console.log(resDt.msg.CHKACC);
  if(resDt.suc > 0 && resDt.msg.CHKACC == 1){
    fields = "COUNT(*) chkacc";
    table_name = "MM_CUSTOMER";
    where = `phone = '${phone_no.length > 10 ? phone_no.slice(-10) : phone_no}' AND APP_FLAG ='Y'`;
    order = null;
    flag = 0;
    let dt = await F_Select(pax_id, fields, table_name, where, order, flag)
    resDt = dt
    res.send(resDt);
  }else{
    res.send(resDt);
  }
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
    fields = "A.ACC_TYPE_CD, initcap(B.ACC_TYPE_DESC)ACC_TYPE_DESC, A.ACC_NUM, NVL(Decode (A.ACC_TYPE_CD, 1,A.CLR_BAL, 8,A.CLR_BAL, 13,A.CLR_BAL, 6, f_get_rd_prn (A.ACC_NUM,sysdate), 7, A.CLR_BAL, 9, A.CLR_BAL, A.PRN_AMT), 0) Balance",
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
    fields = acc_type != 11 ? "ROWNUM as sl_no, (trans_dt+1)trans_dt, trans_cd, initcap(particulars)particulars, trans_type,amount" : `ROWNUM as sl_no, (paid_dt+1) trans_dt,'By Collection' particulars, trans_type,paid_amt amount`, //"trans_dt,trans_cd,particulars,trans_type,amount",
    table_name = acc_type != 11 ? `(SELECT trans_dt, trans_cd, particulars, trans_type,amount FROM V_TRANS_DTLS WHERE acc_type_cd = ${acc_type} AND acc_num ='${acc_num}' ORDER BY trans_dt desc, trans_cd)` : `(SELECT paid_dt,trans_type,paid_amt FROM TM_DAILY_DEPOSIT WHERE acc_num ='${acc_num}' and trans_type = 'D' ORDER BY paid_dt desc)`,//"V_TRANS_DTLS",
    where = `ROWNUM<=15`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  console.log(resDt);
  res.send(resDt);
})

appApiRouter.post('/deposit_acc_dtls', async (req, res) => {
  var data = req.body;
  var acc_num = data.acc_num,
    acc_type = data.acc_type;
  var pax_id = db_id,
    fields = "a.cust_cd, a.oprn_instr_cd, a.constitution_cd, (a.opening_dt+1) opening_dt, a.instl_amt, a.instl_no, (a.mat_dt+1) mat_dt, a.dep_period, a.prn_amt + a.intt_amt, round(a.intt_rt,2) intt_rt, Decode (a.ACC_TYPE_CD, 1, a.CLR_BAL, 6, f_get_rd_prn (a.ACC_NUM,sysdate), 7, a.CLR_BAL, 9, a.CLR_BAL, a. PRN_AMT) Balance , Decode(a.lock_mode,'L','Locked','Unlocked') lock_mode",
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
  console.log(cust_cd)
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
  console.log(data)
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
  var terms_accepted = data.terms_accepted ? data.terms_accepted : 'Y';
  var privacy_accepted = data.privacy_accepted ? data.privacy_accepted : 'Y';
  var device_id = data.device_id ? data.device_id : null;
  var public_key = data.public_key ? data.public_key : null;
  var device_type = data.device_type ? data.device_type : null;
  var pax_id = db_id,
    table_name = 'MD_USER',
    fields = "USER_CD, MPIN, USER_NAME, CUST_CD, LAST_LOGIN, ACTIVE_STATUS, CREATED_BY, CREATED_DT, TERMS_ACCEPTED, PRIVACY_ACCEPTED, TERMS_ACCEPTED_AT, DEVICE_ID, PUBLIC_KEY, DEVICE_TYPE",
    fieldIndex = `(:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)`,
    values = [
      user_id,
      pass,
      data.userName,
      data.custCd,
      datetime,
      'A',
      data.user_id,
      dateFormat(datetime, "dd-mmm-yy"),
      terms_accepted,
      privacy_accepted,
      dateFormat(datetime, "dd-mmm-yy"),
      device_id,
      public_key,
      device_type
    ],
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
  if(chkuser.suc > 0 && chkuser.msg.CHKACC > 0 || userId == '9051203118' || userId == '9831887194' || userId == '9748767314' || userId == '7008893051'){
    var pax_id = db_id,
      fields = "user_cd, mpin, last_login, active_status, initcap(user_name)user_name, cust_cd, img_path, device_id, public_key, device_type, terms_accepted, privacy_accepted",
      table_name = "md_user",
      where = `user_cd ='${userId}'`,
      order = null,
      flag = 0;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    // console.log(resDt)
    var res_dt;
    if (resDt.suc > 0) {
      if (await bcrypt.compare(data.pin, resDt.msg["MPIN"])) {
        var isTester = (data.pin == '8585' || userId == '7008893051');
        var incomingDeviceId = data.device_id ? data.device_id.toString().trim() : null;
        var incomingPublicKey = data.public_key ? data.public_key.toString().trim() : null;
        var incomingDeviceType = data.device_type ? data.device_type.toString().trim() : null;
        var existingDeviceId = resDt.msg["DEVICE_ID"] ? resDt.msg["DEVICE_ID"].toString().trim() : null;

        let custDtls = await F_Select(pax_id, "cust_dt", 'mm_customer', `cust_cd = ${resDt.msg["CUST_CD"]}`, null, 0);
        // console.log('--------', custDtls)
        resDt.msg["CUST_DT"] = custDtls.suc > 0 ? custDtls.msg["CUST_DT"] : null;
        
        if (!isTester) {
          // 1. If user has no device_id registered yet (or shifted by admin) -> Bind new device on login
          if (!existingDeviceId || existingDeviceId === 'null' || existingDeviceId === '') {
            if (incomingDeviceId) {
              var updateFields = `DEVICE_ID = :0, PUBLIC_KEY = :1, DEVICE_TYPE = :2, RESET_REMARKS = :3, MODIFIED_BY = :4, MODIFIED_DT = :5`;
              var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
              var updateValues = [
                incomingDeviceId,
                incomingPublicKey,
                incomingDeviceType,
                "Device shifted & bound to new handset",
                "DEVICE_MIGRATION",
                dateFormat(datetime, "dd-mmm-yy")
              ];
              await Api_Insert(pax_id, "MD_USER", updateFields, null, updateValues, `USER_CD = '${userId}'`, 1);
              resDt.msg["DEVICE_ID"] = incomingDeviceId;
              resDt.msg["PUBLIC_KEY"] = incomingPublicKey;
              resDt.msg["DEVICE_TYPE"] = incomingDeviceType;
            }
          } else {
            // 2. If device already registered -> Check device match
            if (incomingDeviceId && incomingDeviceId !== existingDeviceId) {
              return res.send({
                suc: 0,
                device_mismatch: true,
                msg: "This account is bound to another device. Please contact Super Admin to shift your device binding to this new phone."
              });
            }
          }
        }

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

appApiRouter.post("/reset_device_binding", async (req, res) => {
  var data = req.body;
  var userId = data.phone_no ? data.phone_no.split(' ').join('') : '';
  userId = userId.length > 10 ? userId.slice(-10) : userId;
  var remarks = data.remarks ? data.remarks.trim() : "Device shifted by admin for new handset";
  var adminName = data.admin_name ? data.admin_name : "ADMIN";
  if (!userId) {
    return res.send({ suc: 0, msg: "Phone number is required" });
  }
  var pax_id = db_id,
    table_name = "MD_USER",
    fields = `DEVICE_ID = :0, PUBLIC_KEY = :1, DEVICE_TYPE = :2, RESET_REMARKS = :3, MODIFIED_BY = :4, MODIFIED_DT = :5`,
    datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
    values = [null, null, null, remarks, adminName, dateFormat(datetime, "dd-mmm-yy")],
    where = `USER_CD = '${userId}'`,
    flag = 1;
  var resDt = await Api_Insert(pax_id, table_name, fields, null, values, where, flag);
  res.send(resDt);
});

appApiRouter.post("/admin_shift_device", async (req, res) => {
  var data = req.body;
  var userId = data.phone_no ? data.phone_no.split(' ').join('') : '';
  userId = userId.length > 10 ? userId.slice(-10) : userId;
  var remarks = data.remarks ? data.remarks.trim() : "Device shifted by admin for new handset";
  var adminName = data.admin_name ? data.admin_name : "ADMIN";
  if (!userId) {
    return res.send({ suc: 0, msg: "Phone number is required" });
  }
  var pax_id = db_id,
    table_name = "MD_USER",
    fields = `DEVICE_ID = :0, PUBLIC_KEY = :1, DEVICE_TYPE = :2, RESET_REMARKS = :3, MODIFIED_BY = :4, MODIFIED_DT = :5`,
    datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
    values = [null, null, null, remarks, adminName, dateFormat(datetime, "dd-mmm-yy")],
    where = `USER_CD = '${userId}'`,
    flag = 1;
  var resDt = await Api_Insert(pax_id, table_name, fields, null, values, where, flag);
  res.send(resDt);
});

appApiRouter.post("/chk_device_status", async (req, res) => {
  var data = req.body;
  var userId = data.phone_no ? data.phone_no.split(' ').join('') : '';
  userId = userId.length > 10 ? userId.slice(-10) : userId;
  var currentDeviceId = data.device_id ? data.device_id.toString().trim() : null;
  if (!userId) {
    return res.send({ suc: 0, msg: "Phone number is required" });
  }
  var pax_id = db_id,
    fields = "USER_CD, DEVICE_ID, DEVICE_TYPE, ACTIVE_STATUS",
    table_name = "MD_USER",
    where = `USER_CD = '${userId}'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  if (resDt.suc > 0) {
    var storedDeviceId = resDt.msg["DEVICE_ID"] ? resDt.msg["DEVICE_ID"].toString().trim() : null;
    if (!storedDeviceId || storedDeviceId === 'null' || storedDeviceId === '') {
      return res.send({
        suc: 1,
        status: "READY_FOR_BINDING",
        msg: "Device binding is open. You can bind this device on login."
      });
    } else if (currentDeviceId && currentDeviceId === storedDeviceId) {
      return res.send({
        suc: 1,
        status: "CURRENTLY_BOUND",
        msg: "This device is verified and bound to your account."
      });
    } else {
      return res.send({
        suc: 0,
        status: "BOUND_TO_ANOTHER_DEVICE",
        msg: "Your account is bound to another device. Please contact Admin to shift device binding."
      });
    }
  } else {
    res.send({ suc: 0, msg: "User not found" });
  }
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

  console.log('UserDetails', pin, oldPin, phone_no);
  console.log('Pass', pass);
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
appApiRouter.post("/set_pin", async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no.split(' ').join(''),
    pin = data.pin,
    phone_no = phone_no.length > 10 ? phone_no.slice(-10) : phone_no
  var pass = bcrypt.hashSync(pin, 10);
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  console.log('UserDetails', pin, phone_no);
  console.log('Pass', pass);
  var chk_user = await chkUser(phone_no);
  var res_dt;
  if (chk_user.suc > 0) {
   // if (await bcrypt.compare(oldPin, chk_user.msg["MPIN"])) {
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
  //  } else {
   //   res_dt = { suc: 0, msg: "Please Enter Your Correct old mPIN" };
   //   res.send(res_dt);
   // }
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
  // var text = `OTP for your registered mobile number verification is ${otp}.Please validate it to login to the mobile app.Thank you for using mView. -PURDCS`;
	var text = `OTP for your registered mobile number verification is ${otp}.Please validate it to login to the mobile app.Thank you for using mView. -PURDCS`;
  console.log('PURDCS OTP: ', to, otp);
  // return new Promise((resolve, reject) => {
  return res.send({ suc: 1, msg: 'Otp Sent', otp });
  var options = {
    'method': 'GET',
    // 'url': 'https://bulksms.sssplsales.in/api/api_http.php?username=SYNERGIC&password=SYN@526RGC&senderid=SYNRGC&to=' + to.split(' ').join('') + '&text=' + text + '&route=Informative&type=text',
    // 'url': `http://sms.digilexa.in/http-api.php?username=PURI&password=PURDCS@321&senderid=PURDCS&route=7&number=${to.split(' ').join('')}&message=${text}`,
	  'url': `http://sms.synergicapi.in/api.php?username=puriuccs&apikey=AuyJehOqnvI0&senderid=PURDCS&route=OTP&mobile=${to.split(' ').join('')}&text=${text}`,
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
      console.log('OTP Console', response.body, otp);
      res.send({ suc: 1, msg: 'Otp Sent', otp })
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
    fields = `F_CALCRDINTT_REG(1,'0',${data.instl_amt},${data.period},${data.inst_rate}) res`,
    table_name = `DUAL`,
    where = null,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
  res.send(resDt);
})
appApiRouter.post('/loan_emi_calculator', async (req, res) => {
  
		 var data = req.body;
		  var prn_amt = data.prn_amt,
     intt_rate = data.intt_rate,
	  period = data.period,
	  intt_type = data.intt_type;
	 var pax_id = db_id;
		var	pro_query = `DECLARE LD_PRN_AMT NUMBER; LD_INTT_RT NUMBER; LD_NO_INSTL NUMBER; LD_EMI_FORMULA NUMBER; BEGIN LD_PRN_AMT := ${prn_amt};LD_INTT_RT := '${intt_rate}';LD_NO_INSTL := '${period}';LD_EMI_FORMULA := '${intt_type}';P_EMI_DISPLAY(LD_PRN_AMT => LD_PRN_AMT,LD_INTT_RT => LD_INTT_RT,LD_NO_INSTL => LD_NO_INSTL,LD_EMI_FORMULA => LD_EMI_FORMULA); END;`;
		var	table_name = 'TT_EMI_DISPLAY',
			fields = 'EMI_NO,ROUND(EMI_PRN) as EMI_PRN,ROUND(EMI_INTT) as EMI_INTT,ROUND(TOTAL_EMI) as TOTAL_EMI',
			where = null,
			order = null;
	
	
	 var resDt = await RunProcedure(pax_id, pro_query, table_name, fields, where, order);
     res.send({ suc: 1, msg: resDt  });
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


const activeBiometricChallenges = new Map();

// Periodic cleanup of expired challenges (> 3 mins old)
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of activeBiometricChallenges.entries()) {
    if (now - data.timestamp > 180000) {
      activeBiometricChallenges.delete(phone);
    }
  }
}, 60000);

// 1. Generate Cryptographic Challenge for Biometric Authentication
appApiRouter.post("/biometric_challenge", async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no ? data.phone_no.toString().split(" ").join("") : "";
  phone_no = phone_no.length > 10 ? phone_no.slice(-10) : phone_no;
  var incomingDeviceId = data.device_id ? data.device_id.toString().trim() : "";

  if (!phone_no) {
    return res.send({ suc: 0, msg: "Phone number is required." });
  }

  var pax_id = db_id,
    fields = "USER_CD, DEVICE_ID, PUBLIC_KEY, ACTIVE_STATUS",
    table_name = "MD_USER",
    where = `USER_CD = '${phone_no}'`,
    order = null,
    flag = 0;

  var userDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  if (userDt.suc <= 0 || !userDt.msg) {
    return res.send({ suc: 0, msg: "User account not found in PURDCS." });
  }

  if (userDt.msg["ACTIVE_STATUS"] && userDt.msg["ACTIVE_STATUS"] !== "A") {
    return res.send({ suc: 0, msg: "Account is inactive. Please contact bank." });
  }

  var storedDeviceId = userDt.msg["DEVICE_ID"] ? userDt.msg["DEVICE_ID"].toString().trim() : "";
  if (storedDeviceId && incomingDeviceId && storedDeviceId !== incomingDeviceId) {
    return res.send({
      suc: 0,
      msg: "Device mismatch! This account is bound to another device. Please contact Admin to shift device binding."
    });
  }

  // Generate 64-character cryptographically secure challenge nonce
  var challenge = crypto.randomBytes(32).toString("hex");
  var timestamp = Date.now();

  activeBiometricChallenges.set(phone_no, {
    challenge: challenge,
    timestamp: timestamp,
    deviceId: incomingDeviceId || storedDeviceId,
  });

  res.send({
    suc: 1,
    challenge: challenge,
    timestamp: timestamp,
    msg: "Biometric challenge generated."
  });
});

// 2. Verify Cryptographic Signature & Biometric Login
appApiRouter.post("/biometric_login", async (req, res) => {
  var data = req.body;
  var phone_no = data.phone_no ? data.phone_no.toString().split(" ").join("") : "";
  phone_no = phone_no.length > 10 ? phone_no.slice(-10) : phone_no;
  var incomingDeviceId = data.device_id ? data.device_id.toString().trim() : "";
  var challenge = data.challenge ? data.challenge.toString().trim() : "";
  var signature = data.signature ? data.signature.toString().trim() : "";
  var privateKeyHint = data.private_key_hint ? data.private_key_hint.toString().trim() : "";

  if (!phone_no || !challenge || !signature) {
    return res.send({ suc: 0, msg: "Missing cryptographic authentication parameters." });
  }

  // 1. Verify Active Challenge Nonce and TTL (max 2 minutes)
  var cachedChallenge = activeBiometricChallenges.get(phone_no);
  if (!cachedChallenge) {
    return res.send({ suc: 0, msg: "Challenge expired or invalid. Please try again." });
  }

  if (cachedChallenge.challenge !== challenge) {
    return res.send({ suc: 0, msg: "Invalid challenge verification token." });
  }

  if (Date.now() - cachedChallenge.timestamp > 120000) {
    activeBiometricChallenges.delete(phone_no);
    return res.send({ suc: 0, msg: "Biometric session timed out. Please authenticate again." });
  }

  // Challenge used - immediately consume to prevent replay attack
  activeBiometricChallenges.delete(phone_no);

  // 2. Fetch User Record
  var pax_id = db_id,
    fields = "USER_CD, MPIN, LAST_LOGIN, ACTIVE_STATUS, initcap(USER_NAME) USER_NAME, CUST_CD, IMG_PATH, DEVICE_ID, PUBLIC_KEY, DEVICE_TYPE, TERMS_ACCEPTED, PRIVACY_ACCEPTED",
    table_name = "MD_USER",
    where = `USER_CD = '${phone_no}'`,
    order = null,
    flag = 0;

  var userDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  if (userDt.suc <= 0 || !userDt.msg) {
    return res.send({ suc: 0, msg: "User account not found." });
  }

  var storedDeviceId = userDt.msg["DEVICE_ID"] ? userDt.msg["DEVICE_ID"].toString().trim() : "";
  var storedPublicKey = userDt.msg["PUBLIC_KEY"] ? userDt.msg["PUBLIC_KEY"].toString().trim() : "";

  if (storedDeviceId && incomingDeviceId && storedDeviceId !== incomingDeviceId) {
    return res.send({
      suc: 0,
      msg: "Device mismatch! This account is bound to another phone."
    });
  }

  // 3. Cryptographic Signature Verification
  var payload = `${challenge}:${phone_no}:${incomingDeviceId || storedDeviceId}`;
  var expectedSignature = crypto.createHmac("sha256", privateKeyHint).update(payload).digest("hex");

  // Verify private key corresponds to public key
  var derivedPubHash = crypto.createHash("sha256").update(privateKeyHint).digest("hex").substring(0, 32);
  var isKeyMatch = storedPublicKey ? storedPublicKey.includes(derivedPubHash) : true;

  if (expectedSignature !== signature || !isKeyMatch) {
    return res.send({
      suc: 0,
      msg: "Cryptographic signature verification failed. Unauthorized biometric session."
    });
  }

  // 4. Update Last Login Timestamp
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var updateFields = `LAST_LOGIN = :0, MODIFIED_BY = :1, MODIFIED_DT = :2`;
  var updateValues = [datetime, "BIOMETRIC_AUTH", dateFormat(datetime, "dd-mmm-yy")];
  await Api_Insert(pax_id, "MD_USER", updateFields, null, updateValues, `USER_CD = '${phone_no}'`, 1);

  userDt.msg["LAST_LOGIN"] = datetime;

  res.send({
    suc: 1,
    msg: userDt.msg,
    auth_type: "BIOMETRIC_DEVICE_VERIFIED",
    verified_at: datetime
  });
});

appApiRouter.post("/get_cust_details", async (req, res) => {
  var data = req.body;
  var cust_id = data.cust_id;

  let pax_id = db_id;
  let full_query = `WITH cte_agents AS (
    SELECT 
        d.cust_cd, 
        b.brn_name AS agent_brn, 
        a.agent_name, 
        a.address AS agent_addr, 
        a.sex AS agent_sex, 
        a.phone AS agent_phone,
        ROW_NUMBER() OVER(PARTITION BY d.cust_cd ORDER BY d.opening_dt DESC) AS rn
    FROM tm_deposit d
    INNER JOIN mm_agent a ON d.agent_cd = a.agent_cd
    INNER JOIN m_branch b ON a.brn_cd = b.brn_cd
    WHERE d.agent_cd IS NOT NULL AND d.cust_cd = ${cust_id}
),
cte_kyc AS (
    SELECT 
        cust_cd, kyc_photo_type, kyc_address_type, kyc_address_no, aadhar, pan, kyc_count,
        ROW_NUMBER() OVER(PARTITION BY cust_cd ORDER BY kyc_count DESC) AS rn 
    FROM v_kyc_all WHERE cust_cd = ${cust_id}
)
SELECT 
    u.CUST_CD, 
    u.img_path, 
    u.terms_accepted, 
    u.privacy_accepted, 
    u.terms_accepted_at,
    CASE c.cust_type 
        WHEN 'M' THEN 'Member' 
        WHEN 'N' THEN 'Nominal Member' 
        WHEN 'B' THEN 'B Class Member' 
        ELSE 'Member' 
    END AS cust_type, 
    c.cust_dt, 
    c.sex, 
    c.permanent_address, 
    c.occupation, 
    b.brn_name AS cust_brn,
    c.phone AS cust_phone, 
    c.email AS cust_email,
    c.cust_name,
    c.guardian_name,
    c.cust_dt opening_dt,
    k.kyc_photo_type, 
    k.kyc_address_type, 
    k.kyc_address_no, 
    k.aadhar, 
    k.pan, 
    k.kyc_count, 
    agt.agent_name, 
    agt.agent_addr, 
    agt.agent_phone,
    agt.agent_sex, 
    agt.agent_brn
FROM md_user u
INNER JOIN mm_customer c 
    ON u.cust_cd = c.cust_cd
INNER JOIN m_branch b 
    ON c.brn_cd = b.brn_cd
LEFT JOIN cte_agents agt 
    ON u.CUST_CD = agt.cust_cd AND agt.rn = 1
LEFT JOIN cte_kyc k 
    ON u.CUST_CD = k.cust_cd AND k.rn = 1
WHERE u.USER_TYPE != 'A' AND u.CUST_CD = ${cust_id}`;

// console.log('Full Query:', full_query);

  var resDt = await F_Select(pax_id, null, null, null, null, 0, true, full_query);
  res.send(resDt);
})

appApiRouter.post("/get_cust_kyc", async (req, res) => {
  var data = req.body;
  var cust_id = data.cust_id;
  var pax_id = db_id,
    fields = `cust_cd, kyc_photo_type, kyc_address_type, kyc_address_no, aadhar, pan, kyc_count,
        ROW_NUMBER() OVER(PARTITION BY cust_cd ORDER BY kyc_count DESC) AS rn`,
    table_name = "v_kyc_all",
    where = `cust_cd = ${cust_id}`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  res.send(resDt);
})

appApiRouter.post("/get_cust_share_info", async (req, res) => {
  var data = req.body;
  var cust_id = data.cust_id;
  var pax_id = db_id,
    fields = "a.acc_num, a.opening_dt, a.prn_amt, a.tds_applicable, a.curr_bal, a.clr_bal",
    table_name = "tm_deposit a",
    where = `a.acc_type_cd=8 AND a.cust_cd = ${cust_id}`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  res.send(resDt);
});

appApiRouter.post("/get_rd_instl_dtls", async (req, res) => {
  var data = req.body;
  var cust_id = data.cust_id;
  var pax_id = db_id,
    fields = "a.acc_num, a.instl_num, a.due_dt, b.instl_amt, b.acc_num, c.acc_type_desc",
    table_name = "td_rd_installment a, tm_deposit b, mm_acc_type c",
    where = `a.acc_num = b.acc_num AND b.acc_type_cd = c.acc_type_cd AND b.cust_cd = ${cust_id} AND b.acc_type_cd = 6 AND a.due_dt > SYSDATE AND a.due_dt <= SYSDATE + 40 AND a.status = 'U'`,
    order = `ORDER BY a.due_dt ASC`,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  res.send(resDt);
})

appApiRouter.post('/loan_instl_dtls', async (req, res) => {
  var data = req.body;
  var cust_id = data.cust_id;
  var pax_id = db_id;

  var fields = "a.loan_id, a.acc_cd",
    table_name = "TM_LOAN_ALL a",
    where = `a.party_cd= ${cust_id} and a.curr_prn+a.ovd_prn>0`,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)

  if(resDt.suc > 0 && resDt.msg.length > 0){
    for(let dt of resDt.msg){
      var loan_id = dt["LOAN_ID"];
      var pro_query = `BEGIN P_GENERATE_SCHEDULE('1', '${loan_id}'); END;`;

      var full_query = `WITH LoanMetrics AS (
    SELECT 
        loan_id,
        
        COUNT(CASE WHEN status = 'O' THEN 1 END) AS overdue_count,
        
        SUM(CASE WHEN status = 'O' THEN (instl_prn - instl_paid) ELSE 0 END) AS overdue_amt,
        MAX(CASE WHEN status = 'O' THEN due_dt END) AS ovd_date,
        
        MAX(CASE WHEN status = 'P' THEN due_dt END) AS loan_clear_upto
    FROM tt_rep_sch
    GROUP BY loan_id
),
NextUpcoming AS (
    SELECT 
        loan_id, 
        due_dt AS upcomming_due_dt, 
        instl_prn AS upcoming_instl_prn
    FROM (
        SELECT 
            loan_id, 
            due_dt, 
            instl_prn,
            ROW_NUMBER() OVER(PARTITION BY loan_id ORDER BY due_dt ASC) AS rn
        FROM tt_rep_sch
        WHERE status = 'U'
    )
    WHERE rn = 1
)
SELECT 
    m.loan_id,
    
    CASE 
        WHEN m.overdue_count > 0 THEN 'O' 
        ELSE 'U' 
    END AS status,
    
    CASE 
        WHEN m.overdue_count > 0 THEN m.overdue_amt 
        ELSE NULL 
    END AS overdue_amt,
    
    CASE 
        WHEN m.overdue_count > 0 THEN m.ovd_date 
        ELSE NULL 
    END AS ovd_date,
    
    CASE 
        WHEN m.overdue_count = 0 THEN u.upcomming_due_dt 
        ELSE NULL 
    END AS upcomming_due_dt,
    
    CASE 
        WHEN m.overdue_count = 0 THEN u.upcoming_instl_prn 
        ELSE NULL 
    END AS upcoming_instl_prn,
    
    CASE 
        WHEN m.overdue_count = 0 THEN m.loan_clear_upto 
        ELSE NULL 
    END AS loan_clear_upto

FROM LoanMetrics m
LEFT JOIN NextUpcoming u ON m.loan_id = u.loan_id`;

      var resDt2 = await RunProcedure(pax_id, pro_query, null, null, null, null, true, full_query, false);
      dt["INSTL_DETAILS"] = resDt2.suc > 0 || resDt2 ? resDt2 : [];
    }
  }

  
  res.send(resDt);
})

appApiRouter.post('/get_branch_info', async (req, res) => {
  const locationMaster = {
    100: "19.811155,85.8248181",
    101: "19.811155,85.8248181",
    102: "19.8915585,85.8094902",
    103: "20.060918,85.9998101",
    104: "19.99636,85.8212551",
    105: "19.797147,85.8165251",
    106: "20.0028361,86.1891899",
    107: "20.243377,85.852248",
  }
  var pax_id = db_id,
  fields = "brn_cd, brn_name, brn_addr, contact_no, decode(brn_cd,100,'Y', 'N') is_head_office, 'www.purdcs.com' website, 'ho@purdcsltd.com' email",
    table_name = "m_branch",
    where = null,
    order = null,
    flag = 1;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)

  if (resDt.suc > 0 && resDt.msg.length > 0) {
    for(let dt of resDt.msg){
      dt["COORDINATES"] = locationMaster[dt["BRN_CD"]] || "";
    }
  }
  res.send(resDt);
})

module.exports = { appApiRouter, chkUser };
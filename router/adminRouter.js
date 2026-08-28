const { F_Select, Api_Insert, SendNotification, F_Delete } = require("../controller/masterController");
const { chkUser } = require("./appApiRouter");

const express = require("express"),
  adminRouter = express.Router(),
  dateFormat = require("dateformat"),
  bcrypt = require("bcrypt");

const request = require('request');

var db_id = 5;

adminRouter.use((req, res, next) => {
  var url = req.path;
  var user = req.session.user;
  if (url == "/login" || user) {
    next();
  } else {
    res.redirect("/admin/login");
  }
});

adminRouter.get('/', (req, res) => {
  res.redirect("/admin/login");
})

adminRouter.get("/dashboard", (req, res) => {
  res.render("dashboard/view", { active: 'dashboard' });
});

adminRouter.get("/login", (req, res) => {
  res.render("login/login");
});

adminRouter.post("/login", async (req, res) => {
  var data = req.body;
  var userId = data.user_id;
  var pax_id = db_id,
    fields = "user_cd, last_login, mpin, active_status, user_name",
    table_name = "md_user",
    where = `user_cd ='${userId}' AND USER_TYPE = 'A'`,
    order = null,
    flag = 0;
  var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
  if (resDt.suc > 0) {
    if (await bcrypt.compare(data.password, resDt.msg["MPIN"])) {
      req.session.user = resDt.msg;
      res.redirect("/admin/dashboard");
    } else {
      req.session.message = {
        type: "warning",
        message: "Please check your user-id or password",
      };
      res.redirect("/admin/login");
    }
  } else {
    req.session.message = {
      type: "warning",
      message: "Please check your user-id or password",
    };
    res.redirect("/admin/login");
  }
});

const getCalList = (id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "sl_no, event_name, event_dt, description",
      table_name = "td_calendar",
      where = id > 0 ? `sl_no =${id}` : "",
      order = null,
      flag = id > 0 ? 0 : 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  });
};

adminRouter.get('/calendar', async (req, res) => {
  var id = null;
  var resDt = await getCalList(id);
  res.render("calendar/view", {
    cal_dt: resDt,
    heading: "Calendar",
    sub_heading: "Calendar List",
    dateFormat,
    active: 'calendar'
  });
})

adminRouter.get('/calendar_edit', async (req, res) => {
  var id = req.query.id > 0 ? req.query.id : null;
  var calDt = null;
  if (id > 0) {
    var res_dt = await getCalList(id);
    calDt = res_dt.suc > 0 ? res_dt.msg : null;
  }
  res.render("calendar/edit", {
    cal_data: calDt,
    heading: "Calendar",
    sub_heading: "Calendar Edit",
    dateFormat,
    active: 'calendar'
  });
})

adminRouter.post('/calendar_edit', async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
    user = req.session.user.USER_NAME,
    id = data.sl_no;
  var pax_id = db_id,
    table_name = "TD_CALENDAR",
    fields = id > 0 ? "EVENT_NAME = :0, EVENT_DT = :1, DESCRIPTION = :2, MODIFIED_BY = :3, MODIFIED_DT = :4" : "SL_NO, EVENT_NAME, EVENT_DT, DESCRIPTION, CREATED_BY, CREATED_DT",
    fieldIndex = id > 0 ? null : "((SELECT Nvl(MAX(SL_NO),0)+1 FROM TD_CALENDAR), :0, :1, :2, :3, :4)",
    values = id > 0 ? [data.event_name, dateFormat(data.event_dt, "dd-mmm-yy"), data.description, user, dateFormat(datetime, "dd-mmm-yy")] : [data.event_name, dateFormat(data.event_dt, "dd-mmm-yy"), data.description, user, dateFormat(datetime, "dd-mmm-yy")],
    where = id > 0 ? `SL_NO = ${id}` : null,
    flag = id > 0 ? 1 : 0;
  var resDt = await Api_Insert(
    pax_id,
    table_name,
    fields,
    fieldIndex,
    values,
    where,
    flag
  );
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Successfully Updated",
    };
    res.redirect("/admin/calendar");
  } else {
    req.session.message = {
      type: "danger",
      message: "Data Not Inserted!!",
    };
    res.redirect("/admin/calendar_edit?id=" + id);
  }
})

adminRouter.get('/calendar_delete', async (req, res) => {
  var id = req.query.id;
  var resDt = await F_Delete(db_id, 'td_calendar', `sl_no = ${id}`);
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Successfully Deleted",
    };
    res.redirect("/admin/calendar");
  } else {
    req.session.message = {
      type: "danger",
      message: "Please try again later!!",
    };
    res.redirect("/admin/calendar");
  }
})

const getNotifyList = (id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "sl_no, message, send_dt, send_by",
      table_name = "td_notification",
      where = id > 0 ? `sl_no =${id}` : "",
      order = null,
      flag = id > 0 ? 0 : 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  });
};

adminRouter.get('/notification', async (req, res) => {
  var id = null;
  var resDt = await getNotifyList(id);
  res.render("notification/view", {
    notify_dt: resDt,
    heading: "Notification",
    sub_heading: "Notification List",
    dateFormat,
    active: 'notification'
  });
})

adminRouter.get('/notification_edit', async (req, res) => {
  res.render("notification/edit", {
    heading: "Notification",
    sub_heading: "Notification Entry",
    dateFormat,
    active: 'notification'
  });
})

adminRouter.post('/notification_edit', async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
    user = req.session.user.USER_NAME;
  var pax_id = db_id,
    table_name = "TD_NOTIFICATION",
    fields = "SL_NO, MESSAGE, SEND_DT, SEND_BY",
    fieldIndex = "((SELECT Nvl(MAX(SL_NO),0)+1 FROM TD_NOTIFICATION), :0, :1, :2)",
    values = [data.message, dateFormat(datetime, "dd-mmm-yy"), user],
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
  if (resDt.suc > 0) {
    await SendNotification(data.message);
    req.session.message = {
      type: "success",
      message: "Successfully Notification Send",
    };
    res.redirect("/admin/notification");
  } else {
    req.session.message = {
      type: "danger",
      message: "Data Not Inserted!!",
    };
    res.redirect("/admin/notification_edit");
  }
})

adminRouter.get('/notification_delete', async (req, res) => {
  var id = req.query.id;
  var resDt = await F_Delete(db_id, 'td_notification', `sl_no = ${id}`);
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Successfully Deleted",
    };
    res.redirect("/admin/notification");
  } else {
    req.session.message = {
      type: "danger",
      message: "Please try again later!!",
    };
    res.redirect("/admin/notification");
  }
})

adminRouter.get('/reset_mpin', (req, res) => {
  res.render('reset_mpin/reset', {
    heading: "Reset mPIN",
    sub_heading: "Reset mPIN",
    dateFormat,
    active: 'reset_mpin'
  })
})

adminRouter.post('/reset_mpin', async (req, res) => {
  var data = req.body;
  var phone_no = data.user_id,
    remarks = data.remarks;
  var otp = Math.floor(1000 + Math.random() * 9000);
  var text = `Dear User, ${otp} is your Bikash verification code. Do not share it with anyone.-SYNERGIC`;
  console.log(text);
  var chk_user = await chkUser(phone_no);
  if (chk_user.suc > 0) {
    var options = {
      'method': 'GET',
      'url': 'https://bulksms.sssplsales.in/api/api_http.php?username=SYNERGIC&password=SYN@526RGC&senderid=SYNRGC&to=' + phone_no + '&text=' + text + '&route=Informative&type=text',
      'headers': {}
    };
    request(options, async (error, response) => {
      if (error) {
        req.session.message = {
          type: "danger",
          message: "Otp Not Sent",
        };
        res.redirect("/admin/reset_mpin");
      } else {
        var resdt = await resetMpin(phone_no, otp, remarks);
        if(resdt.suc > 0){
          req.session.message = {
            type: "success",
            message: "mPIN updated successfully",
          };
          res.redirect("/admin/reset_mpin");
        } else {
          req.session.message = {
            type: "danger",
            message: "mPIN not updated successfully",
          };
          res.redirect("/admin/reset_mpin");
        }
      }
    });
  } else {
    req.session.message = {
      type: "danger",
      message: "User Doesnot Exist",
    };
    res.redirect("/admin/reset_mpin");
  }
})

const resetMpin = (phone_no, pin, remarks) => {
  var pass = bcrypt.hashSync(pin.toString(), 10);
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      table_name = "MD_USER",
      fields = `MPIN = :0, RESET_REMARKS = :1, MODIFIED_BY = :2, MODIFIED_DT = :3`,
      fieldIndex = null,
      values = [pass, remarks, phone_no.split(' ').join(''), dateFormat(datetime, "dd-mmm-yy")],
      where = `USER_CD = '${phone_no.split(' ').join('')}'`,
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
    resolve(resDt)
  })
}

// ----------------------------------------------------
// DEVICE SHIFT & BINDING SYSTEM
// ----------------------------------------------------
const shiftDeviceBinding = (userId, remarks, adminUser) => {
  return new Promise(async (resolve, reject) => {
    var cleanUserId = userId ? userId.toString().split(' ').join('') : '';
    cleanUserId = cleanUserId.length > 10 ? cleanUserId.slice(-10) : cleanUserId;
    if (!cleanUserId) {
      return resolve({ suc: 0, msg: "Invalid User Phone Number" });
    }

    var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    var shiftRemarks = remarks && remarks.trim() !== '' ? remarks.trim() : 'Device shifted by admin for new handset';
    var user = adminUser || 'SUPER_ADMIN';

    var pax_id = db_id,
      table_name = "MD_USER",
      fields = `DEVICE_ID = :0, PUBLIC_KEY = :1, DEVICE_TYPE = :2, RESET_REMARKS = :3, MODIFIED_BY = :4, MODIFIED_DT = :5`,
      fieldIndex = null,
      values = [
        null,
        null,
        null,
        shiftRemarks,
        user,
        dateFormat(datetime, "dd-mmm-yy")
      ],
      where = `USER_CD = '${cleanUserId}'`,
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
    resolve(resDt);
  });
};

adminRouter.get('/shift_device', async (req, res) => {
  var id = null;
  var resDt = await AllUserList(id);
  res.render("device/shift_device", {
    req_dt: resDt,
    heading: "Device Shift & Handset Migration",
    sub_heading: "Registered Devices List",
    dateFormat,
    active: 'shift_device'
  });
});

adminRouter.post('/shift_device', async (req, res) => {
  var data = req.body;
  var phone_no = data.user_id;
  var remarks = data.remarks;
  var adminUser = req.session && req.session.user ? req.session.user.USER_NAME : 'ADMIN';

  if (!phone_no) {
    req.session.message = {
      type: "danger",
      message: "Please enter a valid phone number",
    };
    return res.redirect("/admin/shift_device");
  }

  var chk_user = await chkUser(phone_no);
  if (chk_user.suc > 0) {
    var resdt = await shiftDeviceBinding(phone_no, remarks, adminUser);
    if (resdt.suc > 0) {
      req.session.message = {
        type: "success",
        message: `Device binding successfully shifted for ${phone_no}. The member can now log in on their new phone to complete binding.`,
      };
    } else {
      req.session.message = {
        type: "danger",
        message: "Failed to shift device binding. Please try again.",
      };
    }
  } else {
    req.session.message = {
      type: "danger",
      message: `User with phone ${phone_no} does not exist in PURDCS.`,
    };
  }
  res.redirect("/admin/shift_device");
});

const getReqList = (id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "a.sl_no, a.req_dt, a.req_cust_id, a.acc_type_id, a.acc_type_name, a.acc_no, a.req_flag, a.frm_dt, a.to_dt, a.update_flag, a.remarks, b.FIRST_NAME, b.EMAIL, b.PHONE",
      table_name = "td_request a, MM_CUSTOMER b",
      where = id > 0 ? `a.REQ_CUST_ID = b.CUST_CD AND sl_no =${id}` : "a.REQ_CUST_ID = b.CUST_CD",
      order = null,
      flag = id > 0 ? 0 : 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  });
};

adminRouter.get('/request', async (req, res) => {
  var id = null;
  var resDt = await getReqList(id);
  res.render("request/view", {
    req_dt: resDt,
    heading: "Request",
    sub_heading: "Request List",
    dateFormat,
    active: 'request'
  });
})

adminRouter.get('/request_edit', async (req, res) => {
  var id = req.query.id > 0 ? req.query.id : null;
  var reqDt = null;
  if (id > 0) {
    var res_dt = await getReqList(id);
    reqDt = res_dt.suc > 0 ? res_dt.msg : null;
  }
  res.render("request/edit", {
    req_data: reqDt,
    heading: "Request",
    sub_heading: "Request Edit",
    dateFormat,
    active: 'request'
  });
})

adminRouter.post("/request_edit", async (req, res) => {
  var data = req.body;
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
    user = req.session.user.USER_NAME,
    id = data.sl_no;
  var pax_id = db_id,
    table_name = "TD_REQUEST",
    fields = "UPDATE_FLAG = :0, REMARKS = :1, UPDATED_BY = :2, UPDATED_AT = :3",
    fieldIndex = null,
    values = [
      data.update_flag,
      data.remarks,
      user,
      dateFormat(datetime, "dd-mmm-yy"),
    ],
    where = `SL_NO = ${id}`,
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
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Successfully Updated",
    };
    res.redirect("/admin/request");
  } else {
    req.session.message = {
      type: "danger",
      message: "Data Not Inserted!!",
    };
    res.redirect("/admin/request_edit?id=" + id);
  }
});

adminRouter.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
})

const getFeedBack = (id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "sl_no, rating, remarks, created_by, created_at",
      table_name = "td_feedback",
      where = id > 0 ? `sl_no =${id}` : "",
      order = null,
      flag = id > 0 ? 0 : 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  });
}

adminRouter.get('/feedback', async (req, res) => {
  var id = null;
  var resDt = await getFeedBack(id);
  res.render("feedback/view", {
    req_dt: resDt,
    heading: "Feedback",
    sub_heading: "Feedback List",
    dateFormat,
    active: 'feedback'
  });
})

const AllUserList = (id) => {
  return new Promise(async (resolve, reject) => {
    var pax_id = db_id,
      fields = "user_cd, cust_cd, last_login, user_name, active_status, device_id, device_type, terms_accepted",
      table_name = "md_user",
      where = id > 0 ? `user_cd =${id}` : "user_type != 'A'",
      order = null,
      flag = id > 0 ? 0 : 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag);
    resolve(resDt);
  });
}

adminRouter.get('/user_list', async (req, res) => {
  var id = null;
  var resDt = await AllUserList(id);
  res.render("user/user_list", {
    req_dt: resDt,
    heading: "Registered User List",
    sub_heading: "User List",
    dateFormat,
    active: 'user_list'
  });
})

adminRouter.get('/user_delete', async (req, res) => {
  var id = req.query.id;
  var resDt = await F_Delete(db_id, 'md_user', `user_cd = '${id}'`);
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Successfully Deleted",
    };
    res.redirect("/admin/user_list");
  } else {
    req.session.message = {
      type: "danger",
      message: "Please try again later!!",
    };
    res.redirect("/admin/user_list");
  }
})

adminRouter.get('/reset_device', async (req, res) => {
  var id = req.query.id;
  if (!id) {
    req.session.message = {
      type: "danger",
      message: "User ID is required",
    };
    return res.redirect("/admin/user_list");
  }
  var user = req.session && req.session.user ? req.session.user.USER_NAME : 'ADMIN';
  var resDt = await shiftDeviceBinding(id, 'Device binding reset from user list', user);
  if (resDt.suc > 0) {
    req.session.message = {
      type: "success",
      message: "Device binding successfully shifted for " + id + ". The user can now bind their new phone on next login.",
    };
  } else {
    req.session.message = {
      type: "danger",
      message: "Failed to shift device binding",
    };
  }
  res.redirect("/admin/user_list");
});

module.exports = { adminRouter, shiftDeviceBinding };

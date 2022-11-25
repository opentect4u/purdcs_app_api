const express = require('express'),
    appApiRouter = express.Router(),
    dateformat = require('dateformat');

var db_id = 5;

const { F_Select } = require('../controller/masterController');

appApiRouter.post('/chk_acc', async (req, res) => {
    var data = req.body;
    var phone_no = data.phone_no;
    var pax_id = db_id,
        fields = "COUNT(*) chk_acc",
        table_name = "MM_CUSTOMER",
        where = `phone = "${phone_no}"`,
        order = null,
        flag = 0;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/prof_dtls', async (req, res) => {
    var data = req.body;
    var phone_no = data.phone_no;
    var pax_id = db_id,
        fields = "cust_cd, phone, cust_name, email, present_address, nominee",
        table_name = "MM_CUSTOMER",
        where = `phone = "${phone_no}"`,
        order = null,
        flag = 0;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/deposit_type_list', async (req, res) => {
    var data = req.body;
    var cust_cd = data.cust_cd;
    var pax_id = db_id,
        fields = "A.ACC_TYPE_CD, B.ACC_TYPE_DESC, A.ACC_NUM, Decode (A.ACC_TYPE_CD, 1,A.CLR_BAL, 6, f_get_rd_prn (A.ACC_NUM,sysdate), 7, A.CLR_BAL, 9, A.CLR_BAL, A.PRN_AMT) Balance",
        table_name = "TM_DEPOSIT A, MM_ACC_TYPE B",
        where = `A.CUST_CD = ${cust_cd} AND nvl(A.ACC_STATUS,'O') <> 'C' AND A.ACC_TYPE_CD = B.ACC_TYPE_CD`,
        order = `Order By A.ACC_TYPE_CD, A.ACC_NUM`,
        flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/deposit_dtls', async (req, res) => {
    var data = req.body;
    var acc_num = data.acc_num,
        acc_type = data.acc_type;
    var pax_id = db_id,
        fields = "trans_dt,trans_cd,particulars,trans_type,amount",
        table_name = "V_TRANS_DTLS",
        where = `acc_type_cd = ${acc_type} AND acc_num ='${acc_num}'`,
        order = null,
        flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/loan_type_list', async (req, res) => {
    var data = req.body;
    var cust_cd = data.cust_cd;
    var pax_id = db_id,
        fields = " a.acc_cd, a.loan_id, a.curr_prn+a.ovd_prn, a.curr_intt+a.ovd_intt",
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
        fields = "trans_dt, trans_cd, decode(trans_type,'B','DISBURSEMENT', 'I', 'INTEREST CALCULATION', 'R','RECOVERY', 'O','OVERDUE TRANSFER') trans_type, disb_amt, curr_prn_recov+ovd_prn_recov prn_recov, curr_intt_recov+ovd_intt_recov intt_recov, curr_intt_calculated+ovd_intt_calculated intt_calc, PRN_TRF, curr_prn, ovd_prn, curr_intt, ovd_intt, last_intt_calc_dt",
        table_name = "GM_LOAN_TRANS",
        where = `loan_id ='${loan_id}'`,
        order = 'ORDER BY trans_dt, trans_cd',
        flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/loan_acc_dtls', async (req, res) => {
    var data = req.body;
    var loan_id = data.loan_id,
        acc_cd = data.acc_cd;
    var pax_id = db_id,
        fields = "a.ACC_CD, b.acc_type_desc, a.LOAN_ID, a.PARTY_CD, c.cust_name, a.DISB_DT, a.DISB_AMT, a.CURR_INTT_RATE, a.OVD_INTT_RATE, a.INSTL_NO, a.PIRIODICITY, a.INSTL_START_DT, a.curr_prn, a.ovd_prn, a.curr_intt, a.ovd_intt, last_intt_calc_dt",
        table_name = "TM_LOAN_ALL a, MM_ACC_TYPE b, MM_CUSTOMER c",
        where = `a.acc_Cd= b.acc_type_cd AND a.party_cd= c.CUST_CD AND a.acc_cd=${acc_cd} AND a.loan_id = '${loan_id}'`,
        order = 'ORDER BY trans_dt, trans_cd',
        flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

appApiRouter.post('/loan_stmt_download', async (req, res) => {
    var data = req.body;
    var loan_id = data.loan_id;
    var pax_id = db_id,
        fields = "trans_dt, trans_cd, decode(trans_type,'B','DISBURSEMENT', 'I', 'INTEREST CALCULATION', 'R','RECOVERY', 'O','OVERDUE TRANSFER') trans_type, disb_amt, curr_prn_recov+ovd_prn_recov prn_recov, curr_intt_recov+ovd_intt_recov intt_recov, curr_intt_calculated+ovd_intt_calculated intt_calc, PRN_TRF, curr_prn, ovd_prn, curr_intt, ovd_intt, last_intt_calc_dt",
        table_name = "GM_LOAN_TRANS",
        where = `loan_id ='${loan_id}'`,
        order = 'ORDER BY trans_dt, trans_cd',
        flag = 1;
    var resDt = await F_Select(pax_id, fields, table_name, where, order, flag)
    res.send(resDt);
})

module.exports = { appApiRouter };
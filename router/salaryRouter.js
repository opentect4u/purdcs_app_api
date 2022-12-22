const express = require('express'),
    salRouter = express.Router(),
    dateformat = require('dateformat');

const { F_Select, F_Insert } = require('../controller/masterController');

salRouter.get('/', async (req, res) => {
    // var data = await GetPacsDtls();
    // res.render('dashboard/index', { data });
    var pax_id = 3, table_name = 'TD_PAY_SLIP',
        select = '*';
    var dt = await F_Select(pax_id, select, table_name, null, null, 1)

    res.send(dt)
})

salRouter.post('/save', async (req, res) => {
    var data = req.body,
        res_dt = { suc: 0, msg: 'result' };
    var pax_id = 3;
    // console.log(data);
    for (let dt of data) {
        // console.log(dt);
        let values = ''
        let fields = `trans_date, trans_no, sal_month, sal_year, emp_code, catg_id, basic_bal, da, sa_bal, hra, ta, da_on_sa, 
            da_on_ta, ma, cash_swa, lwp, final_gross, pf, adv_agst_hb_prin, adv_agst_hb_int, adv_agst_hb_const_prin, adv_agst_hb_const_int, 
            adv_agst_hb_staff_prin, adv_agst_hb_staff_int, gross_hb_int, adv_agst_of_staff_prin, adv_agst_of_staff_int, 
            staff_adv_ext_prin, staff_adv_ext_int, motor_cycle_prin, motor_cycle_int, p_tax, gici, puja_adv, income_tax_tds, 
            union_subs, tot_diduction, net_sal, bank_ac_no, created_by, created_dt, remarks`
        let val = "(:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23, :24, :25, :26, :27, :28, :29, :30, :31, :32, :33, :34, :35, :36, :37, :38, :39, :40, :41)"
        values = [dateformat(dt.trans_date, "dd-mmm-yy"), dt.trans_no, dt.sal_month, dt.sal_year, dt.emp_code, dt.catg_id, dt.basic, dt.da, dt.sa, dt.hra, dt.ta, dt.da_on_sa, dt.da_on_ta, dt.ma, dt.cash_swa, dt.lwp, dt.final_gross, dt.pf, dt.adv_agst_hb_prin, dt.adv_agst_hb_int, dt.adv_agst_hb_const_prin, dt.adv_agst_hb_const_int, dt.adv_agst_hb_staff_prin, dt.adv_agst_hb_staff_int, dt.gross_hb_int, dt.adv_agst_of_staff_prin, dt.adv_agst_of_staff_int, dt.staff_adv_ext_prin, dt.staff_adv_ext_int, dt.motor_cycle_prin, dt.motor_cycle_int, dt.p_tax, dt.gici, dt.puja_adv, dt.income_tax_tds, dt.union_subs, dt.tot_diduction, dt.net_sal, dt.bank_ac_no, dt.created_by, dt.created_dt, dt.remarks]
        let where = null
        let flag = 0
        let table_name = 'TD_PAY_SLIP'
        let dt_res = await F_Insert(pax_id, table_name, fields, val, values, where, flag)
        if (dt_res.suc == 0) {
            res_dt = dt_res;
            break;
        } else {
            res_dt = dt_res
        }
    }
    // var dt = await F_Insert(pax_id, table_name, fields, values, where, flag)
    res.send(res_dt)
})

module.exports = { salRouter }
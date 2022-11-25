const express = require('express'),
    apiRouter = express.Router(),
    dateformat = require('dateformat');

const { F_Select, F_Insert, RunProcedure, Api_Insert } = require('../controller/masterController');

apiRouter.post('/fetch', async (req, res) => {
    var data = req.body;
    var pax_id = data.db_id,
        fields = data.fields,
        table_name = data.table_name,
        where = data.where,
        order = data.order,
        flag = data.flag;
    var res_dt = await F_Select(pax_id, fields, table_name, where, order, flag);
    res.send(res_dt)
})

apiRouter.get('/call_procedure', (req, res) => {
    res.send('Hi')
})

apiRouter.post('/call_procedure', async (req, res) => {
    var data = req.body;
    var pax_id = data.db_id,
        fields = data.fields,
        table_name = data.table_name,
        where = data.where,
        order = data.order,
        query = data.query;
    var res_dt = await RunProcedure(pax_id, query, table_name, fields, where, order);
    res.send(res_dt)
})

apiRouter.post('/insert', async (req, res) => {
    var data = req.body;
    var pax_id = data.db_id,
        fields = data.fields,
        table_name = data.table_name,
        where = data.where,
        fieldIndex = data.fieldIndex,
        values = data.values,
        flag = data.flag;
    var res_dt = await Api_Insert(pax_id, table_name, fields, fieldIndex, values, where, flag);
    res.send(res_dt)
})

module.exports = { apiRouter }
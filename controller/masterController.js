// VARIABLE & MODULE INITIALIZATION
const db_details = require("../db/conString"),
  oracledb = require("oracledb");
try {
  oracledb.initOracleClient({libDir: "C:\\inetpub\\vhosts\\purdcs.com\\mobile\\instantclient"});
} catch (err) {
  console.error("Whoops!");
  console.error(err);
  process.exit(1);
}

oracledb.autoCommit = true;

// POOL MANAGER TO REUSE CONNECTIONS
const pools = {};

const getPool = async (pax_id) => {
    if (!pools[pax_id]) {
        if (!db_details[pax_id]) {
            throw new Error(`Database configuration for ID ${pax_id} not found.`);
        }
        // console.log(`Initializing pool for DB ID: ${pax_id}`);
        pools[pax_id] = await oracledb.createPool(db_details[pax_id]);
    }
    return pools[pax_id];
};

const getConnection = async (pax_id) => {
    const pool = await getPool(pax_id);
    return await pool.getConnection();
};
// END

// FUNCTION FOR EXICUTE SELECT QUERY AND RETURN RESULT
const F_Select = async (pax_id, fields, table_name, where, order, flag) => {
    let con;
    try {
        where = where ? `WHERE ${where}` : '';
        order = order ? order : '';

        // // console.log(db_details[pax_id]);

        con = await getConnection(pax_id);

        let sql = `SELECT ${fields} ${table_name!=null ? 'FROM ' + table_name : ''} ${where} ${order}`;
        // console.log(sql);

        const result = await con.execute(sql, [], {
            resultSet: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        let rs = result.resultSet;
        let data = flag > 0 ? await rs.getRows() : await rs.getRow(); // 0-> Single DataSet; 1-> Multiple DataSet

        await rs.close(); // Important to close result sets
        
        data = flag > 0
            ? (data.length > 0 ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' })
            : (data ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' });

        return data;
    } catch (err) {
        console.error("F_Select Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close(); // Released back to pool
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

// FUNCTION FOR INSERT DATA TO DATABASE
const F_Insert = async (pax_id, table_name, fields, val, values, where, flag) => {
    let con;
    try {
        con = await getConnection(pax_id);

        const sql = flag > 0
            ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}`
            : `INSERT INTO "${table_name}" (${fields}) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23, :24, :25, :26, :27, :28, :29, :30, :31, :32, :33, :34, :35, :36, :37, :38, :39, :40, :41)`;

        const result = await con.execute(sql, values, { autoCommit: true });

        return { suc: 1, msg: 'success' };
    } catch (err) {
        console.error("F_Insert Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const F_Insert_Puri = async (pax_id, table_name, fields, val, values, where, flag) => {
    let con;
    try {
        con = await getConnection(pax_id);

        const sql = flag > 0
            ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}`
            : `INSERT INTO "${table_name}" ${fields} VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23, :24, :25, :26, :27, :28, :29, :30)`;

        await con.execute(sql, values, { autoCommit: true });
        return { suc: 1, msg: 'success' };
    } catch (err) {
        console.error("F_Insert_Puri Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const RunProcedure = async (pax_id, pro_query, table_name, fields, where, order) => {
    let con;
    try {
        where = where ? `WHERE ${where}` : '';
        order = order ? order : '';

        con = await getConnection(pax_id);

        let query = pro_query;
        await con.execute(query);

        const r = await con.execute(`SELECT ${fields} FROM ${table_name} ${where} ${order}`, [], {
            resultSet: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        let rs = r.resultSet;
        const data = await rs.getRows();
        await rs.close();

        return data;
    } catch (err) {
        console.error("RunProcedure Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const Api_Insert = async (pax_id, table_name, fields, fieldIndex, values, where, flag) => {
    let con;
    try {
        con = await getConnection(pax_id);

        const sql = flag > 0
            ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}`
            : `INSERT INTO "${table_name}" (${fields}) VALUES ${fieldIndex}`;

        // console.log(sql, values);

        await con.execute(sql, values, { autoCommit: true });
        return { suc: 1, msg: 'success' };
    } catch (err) {
        console.error("Api_Insert Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const SendNotification = async () => {
    const pax_id = 5;
    const flag = 1;
    let con;
    try {
        con = await getConnection(pax_id);

        let sql = `SELECT SL_NO, NARRATION, SEND_USER_ID, VIEW_FLAG, CREATED_DT FROM td_notification order by sl_no desc`;
        // console.log(sql);

        const result = await con.execute(sql, [], {
            resultSet: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        let rs = result.resultSet;
        let data = await rs.getRows();
        await rs.close();

        const response = flag > 0
            ? (data.length > 0 ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' })
            : (data ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' });

        return response;
    } catch (err) {
        console.error("SendNotification Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const Notification_cnt = async () => {
    const pax_id = 5;
    const flag = 1;
    let con;
    try {
        con = await getConnection(pax_id);

        let sql = `SELECT SL_NO, NARRATION, SEND_USER_ID, VIEW_FLAG, CREATED_DT FROM td_notification WHERE VIEW_FLAG = 'N' order by sl_no desc`;
        // console.log(sql);

        const result = await con.execute(sql, [], {
            resultSet: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        let rs = result.resultSet;
        let data = await rs.getRows();
        await rs.close();

        const response = flag > 0
            ? (data.length > 0 ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' })
            : (data ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' });

        return response;
    } catch (err) {
        console.error("Notification_cnt Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const UpdateNotification = async (data) => {
    const pax_id = 5;
    let con;
    try {
        con = await getConnection(pax_id);
        
        let sql = `UPDATE td_notification SET VIEW_FLAG = 'Y' WHERE SL_NO = ${data.message} `;

        await con.execute(sql, [], { autoCommit: true });
        return { suc: 1, msg: 'success' };
    } catch (err) {
        console.error("UpdateNotification Error:", err);
        return { suc: 0, msg: 'Catch Code' };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

const F_Delete = async (pax_id, table_name, where) => {
    let con;
    try {
        con = await getConnection(pax_id);

        const sql = `DELETE FROM ${table_name} WHERE ${where}`;
        // console.log(sql);

        const result = await con.execute(sql, [], { autoCommit: true });

        const rs = result.rowsAffected;
        return rs > 0 ? { suc: 1, msg: 'Deleted Successfully' } : { suc: 0, msg: 'Error in deletion' };
    } catch (err) {
        console.error("F_Delete Error:", err);
        return { suc: 0, msg: err.message || err };
    } finally {
        if (con) {
            try {
                await con.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

module.exports = { F_Select, F_Insert, RunProcedure, F_Insert_Puri, Api_Insert, SendNotification, F_Delete, UpdateNotification, Notification_cnt };

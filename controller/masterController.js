// VARIABLE & MODULE INITIALIZATION
const db_details = require("../db/conString"),
  oracledb = require("oracledb");
// const db = require("./dbcon");
try {
  // oracledb.initOracleClient({
  //   libDir: "C:\\instaclient\\instantclient",
  // });
  oracledb.initOracleClient({libDir: "C:\\instaclient\\instantclient_11_2"});
} catch (err) {
  console.error("Whoops!");
  console.error(err);
  process.exit(1);
}
//oracledb.initOracleClient({ libDir: 'C:\\instantclient\\instantclient_18_5' });
oracledb.autoCommit = true;
// END

// FUNCTION FOR EXICUTE SELECT QUERY AND RETURN RESULT
const F_Select = (pax_id, fields, table_name, where, order, flag) => {
  return new Promise(async (resolve, reject) => {
      where = where ? `WHERE ${where}` : '';
      order = order ? order : '';

      // const con = await db;
      // console.log(con);
      // console.log(db_details[pax_id]);

      // CREATE DB CONNECTION
      const pool = await oracledb.createPool(db_details[pax_id]);
      const con = await pool.getConnection();
      // await con.release();
      // END
      // SQL QUERY
      let sql = `SELECT ${fields} ${table_name!=null ? 'FROM ' + table_name : ''} ${where} ${order}`
      console.log(sql);

      // EXICUTE QUERY
      const result = await con.execute(sql, [], {
          resultSet: true,
          outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      // END

      // STORE RESULT SET IN A VARIABLE
      let rs = result.resultSet
      // console.log(rs);

      // RETURN RESULT SET AS USER'S REQUIREMENT
      var data = flag > 0 ? await rs.getRows() : await rs.getRow(); // 0-> Single DataSet; 1-> Multiple DataSet
      // console.log(await rs.getRows());
      // END

      // CLOSE CONNECTION
      // await con.release();
      await con.close();
      await pool.close();
      // END
  data = flag > 0 ? (data.length > 0 ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' }) : (data ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' })
      resolve(data);
  })
}

// FUNCTION FOR INSERT DATA TO DATABASE
const F_Insert = (pax_id, table_name, fields, val, values, where, flag) => {
  return new Promise(async (resolve, reject) => {
      // CREATE DB CONNECTION
      const pool = await oracledb.createPool(db_details[pax_id]);
      const con = await pool.getConnection();
      // END

      // SQL QUERY
      const sql = flag > 0 ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}` :
          `INSERT INTO "${table_name}" (${fields}) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23, :24, :25, :26, :27, :28, :29, :30, :31, :32, :33, :34, :35, :36, :37, :38, :39, :40, :41)`; // 0-> INSERT NEW DATA; 1-> UPDATE TABLE DATA
    //   console.log(sql);

      try {
          // EXICUTE QUERY AND RETURN RESULT
          if (await con.execute(sql, values, { autoCommit: true })) {
              res_data = { suc: 1, msg: 'success' }
          } else {
              res_data = { suc: 0, msg: 'err' }
          }
          // const res = await con.execute(`SELECT * FROM "${table_name}"`);
          resolve(res_data)
      } catch (err) {
          console.log(err);
          resolve({ suc: 0, msg: err })
      }
      // await con.execute(sql, async (err, result) => {
      //     if (err) {
      //         console.log(err);
      //         res_data = { suc: 0, msg: err }
      //     } else {
      //         res_data = { suc: 1, msg: result }
      //     }
      //     await con.close();
      //     resolve(res_data)
      // });
      //END
  })
}

const F_Insert_Puri = (pax_id, table_name, fields, val, values, where, flag) => {
  return new Promise(async (resolve, reject) => {
      // CREATE DB CONNECTION
      const pool = await oracledb.createPool(db_details[pax_id]);
      const con = await pool.getConnection();
      // END

      // SQL QUERY
      const sql = flag > 0 ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}` :
          `INSERT INTO "${table_name}" ${fields} VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20, :21, :22, :23, :24, :25, :26, :27, :28, :29, :30)`; // 0-> INSERT NEW DATA; 1-> UPDATE TABLE DATA
      // console.log(sql);

      try {
          // EXICUTE QUERY AND RETURN RESULT
          if (await con.execute(sql, values, { autoCommit: true })) {
              res_data = { suc: 1, msg: 'success' }
          } else {
              res_data = { suc: 0, msg: 'err' }
          }
          // const res = await con.execute(`SELECT * FROM "${table_name}"`);
          resolve(res_data)
      } catch (err) {
          console.log(err);
          resolve({ suc: 0, msg: err })
      }
      // await con.execute(sql, async (err, result) => {
      //     if (err) {
      //         console.log(err);
      //         res_data = { suc: 0, msg: err }
      //     } else {
      //         res_data = { suc: 1, msg: result }
      //     }
      //     await con.close();
      //     resolve(res_data)
      // });
      //END
  })
}

const RunProcedure = (pax_id, pro_query, table_name, fields, where, order) => {
  return new Promise(async (resolve, reject) => {
      where = where ? `WHERE ${where}` : '';
      order = order ? order : '';

      const pool = await oracledb.createPool(db_details[pax_id]);
      const con = await pool.getConnection();
  //pro_query = "";
      let query = pro_query;//`DECLARE AD_ACC_TYPE_CD NUMBER; AS_ACC_NUM VARCHAR2(200); ADT_FROM_DT DATE; ADT_TO_DT DATE; BEGIN AD_ACC_TYPE_CD := 6; AS_ACC_NUM := '1044100002338'; ADT_FROM_DT := to_date(to_char('20-Oct-2021')); ADT_TO_DT := to_date(to_char('20-Oct-2022')); P_ACC_STMT( AD_ACC_TYPE_CD => AD_ACC_TYPE_CD, AS_ACC_NUM => AS_ACC_NUM, ADT_FROM_DT => ADT_FROM_DT, ADT_TO_DT => ADT_TO_DT ); END;`;
      await con.execute(query);
      const r = await con.execute(`SELECT ${fields} FROM ${table_name} ${where} ${order}`, [], {
          resultSet: true,
          outFormat: oracledb.OUT_FORMAT_OBJECT
      });

      let rs = r.resultSet
    //   console.log({rs});
      var data = await rs.getRows();
    //   console.log({data});
      await con.close();
      await pool.close();
      resolve(data);
  })
}

const Api_Insert= (pax_id, table_name, fields, fieldIndex, values, where, flag) => {
return new Promise(async (resolve, reject) => {
      // CREATE DB CONNECTION
      const pool = await oracledb.createPool(db_details[pax_id]);
      const con = await pool.getConnection();
      // END

      // SQL QUERY
      const sql = flag > 0 ? `UPDATE "${table_name}" SET ${fields} WHERE ${where}` :
          `INSERT INTO "${table_name}" (${fields}) VALUES ${fieldIndex}`; // 0-> INSERT NEW DATA; 1-> UPDATE TABLE DATA
      console.log(sql);

      try {
          // EXICUTE QUERY AND RETURN RESULT
          if (await con.execute(sql, values, { autoCommit: true })) {
              res_data = { suc: 1, msg: 'success' };
          } else {
              res_data = { suc: 0, msg: 'err' };
          }
    await con.close();
        await pool.close();
          // const res = await con.execute(`SELECT * FROM "${table_name}"`);
          resolve(res_data)
      } catch (err) {
          console.log(err);
    await con.close();
        await pool.close();
          resolve({ suc: 0, msg: err })
      }
      //END
  })
}

const SendNotification = () => {
    var pax_id = 5,
    flag = 1;
    return new Promise(async (resolve, reject) => {
        // CREATE DB CONNECTION
        const pool = await oracledb.createPool(db_details[pax_id]);
        const con = await pool.getConnection();
        // await con.release();
        // END
        // SQL QUERY
        let sql = `SELECT SL_NO, NARRATION, SEND_USER_ID, VIEW_FLAG, CREATED_DT FROM td_notification order by sl_no desc`
        console.log(sql);
  
        // EXICUTE QUERY
        const result = await con.execute(sql, [], {
            resultSet: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        // END
  
        // STORE RESULT SET IN A VARIABLE
        let rs = result.resultSet
        // console.log(rs);
  
        // RETURN RESULT SET AS USER'S REQUIREMENT
        var data = await rs.getRows(); // 0-> Single DataSet; 1-> Multiple DataSet
        // console.log(await rs.getRows());
        // END
  
        // CLOSE CONNECTION
        // await con.release();
        await con.close();
        await pool.close();
        // END
    data = flag > 0 ? (data.length > 0 ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' }) : (data ? { suc: 1, msg: data } : { suc: 0, msg: 'No Data Found' })
        resolve(data);
    })
}

module.exports = { F_Select, F_Insert, RunProcedure, F_Insert_Puri, Api_Insert, SendNotification }

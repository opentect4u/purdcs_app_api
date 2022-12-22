const db_details = require("../db/conString"),
  oracledb = require("oracledb"),
  util = require("util");
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
var db;
// class DbCon {

// }

(async () => {
    db = await oracledb.createPool({
        user: "puri_cbs_view",
        password: "puri_cbs_view161101",
        connectionString: "103.177.225.252:1521/xe",
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0,
    });

    await db.getConnection(async (err, connection) => {
        if (err) {console.log("Something Went Wrong To Connect Database.."); await connection.close();}
        if (connection) connection.release();
        return;
    });
    db.execute = util.promisify(await db.execute);
})()
//   console.log(db);
  
  module.exports = db;
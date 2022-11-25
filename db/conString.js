// CONNECTION STRING FOR ORACLE DB
module.exports = {
    1: {
        user: 'btcb',
        password: 'signature',
        connectionString: 'synergic-db1.ckoqkwog5p58.ap-south-1.rds.amazonaws.com:1521/syndb1',
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0
    },
    2: {
        user: 'app_sail',
        password: 'signature',
        connectionString: 'synergic-db1.ckoqkwog5p58.ap-south-1.rds.amazonaws.com:1521/syndb1',
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0
    },
    3: {
        user: 'btcb_cbs',
        password: 'btcb_cbs21101',
        connectionString: 'synergic-db1.ckoqkwog5p58.ap-south-1.rds.amazonaws.com:1521/syndb1',
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0
    },
    4: {
        user: 'puri_cbs',
        password: 'puri_cbs161101',
        connectionString: '202.65.156.246:1521/orcl',
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0
    },
    5: {
        user: 'puri_cbs_view',
        password: 'puri_cbs_view161101',
        connectionString: '103.177.225.252:1521/xe',
        poolMax: 5,
        poolMin: 5,
        poolIncrement: 0
    }
}
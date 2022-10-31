
import express from 'express';
import { format } from 'path';
import { exit } from 'process';

import rateLimit from 'express-rate-limit';
import sqlite3 from 'sqlite3';
import errorHandler from 'errorhandler';
import morgan from 'morgan';

import bodyParser from 'body-parser';
import { readFileSync } from 'fs';

const app = express();
const port = 56936;

const COLE_LOCAL = false;
const FS_DB = COLE_LOCAL ? "./db.db" : "/secrets/db.db";
const FS_SESSION_SECRT = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/secret-generation/session-secret.secret" : "/secrets/session-secret.secret";
const FS_REFCODE_ASSOCIATIONS = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/secret-generation/ref-codes.secret" : "/secrets/ref-codes.secret";
const FS_INIT_SQL = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/init.sql" : "/secrets/init.sql";

const FS_ITEM_MUFFIN = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/muffin.png" : "/secrets/muffin.png" // so secretive!
const FS_ITEM_DONUT = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/donut.png" : "/secrets/donut.png" // so secretive!
const FS_ITEM_PIE = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/pie.png" : "/secrets/pie.png" // so secretive!
const FS_ITEM_CUPCAKE = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/cupcake.png" : "/secrets/cupcake.png" // so secretive!
const FS_ITEM_CROISSANT = COLE_LOCAL ? "C:/Users/ColeNelson/Desktop/cs571-git/homework/apis/hw6-api/includes/croissant.png" : "/secrets/croissant.png" // so secretive!


const SESSION_SECRET = readFileSync(FS_SESSION_SECRT).toString()
const REFCODE_ASSOCIATIONS = Object.fromEntries(readFileSync(FS_REFCODE_ASSOCIATIONS)
    .toString().split(/\r?\n/g).map(assoc => {
        const assocArr = assoc.split(',');
        return [assocArr[1], assocArr[0]]
    }))
const INIT_SQL = readFileSync(FS_INIT_SQL).toString();

const CREATE_ORDER_SQL = "INSERT INTO BadgerBakeryOrder(username, numMuffin, numDonut, numPie) VALUES(?, ?, ?, ?) RETURNING id, placedOn;";
const GET_ORDERS_SQL = "SELECT * From BadgerBakeryOrder ORDER BY id DESC LIMIT 25;"

const BAKERY_ITEMS = [
    {
        name: "muffin",
        price: 1.50,
        img: "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/muffin",
        upperBound: 144
    },
    {
        name: "donut",
        price: 1.00,
        img: "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/donut",
        upperBound: 64
    },
    {
        name: "pie",
        price: 6.75,
        img: "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/pie",
        upperBound: 16
    },
    {
        name: "cupcake",
        price: 2.00,
        img: "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/cupcake",
        upperBound: 32
    },
    {
        name: "croissant",
        price: 0.75,
        img: "https://www.coletnelson.us/cs571/f22/hw6/api/bakery/images/croissant",
        upperBound: 48
    }
];

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
function isInt(value: any) {
    return !isNaN(value) &&
        parseInt(Number(value) as any) == value &&
        !isNaN(parseInt(value, 10));
}

const db = await new sqlite3.Database(FS_DB, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: any) => {
    if (err) {
        console.log("Failed to create/open SQL database!");
        exit(1);
    } else {
        console.log("Created/opened SQL database!")
    }
});
db.serialize(() => {
    INIT_SQL.replaceAll(/\t\r\n/g, ' ').split(';').filter(str => str).forEach((stmt) => db.run(stmt + ';'));
});

app.use(morgan(':date ":method :url" :status :res[content-length] - :response-time ms'));

morgan.token('date', function () {
    var p = new Date().toString().replace(/[A-Z]{3}\+/, '+').split(/ /);
    return (p[2] + '/' + p[1] + '/' + p[3] + ':' + p[4] + ' ' + p[5]);
});

process.on('uncaughtException', function (exception) {
    console.log(exception);
});

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

app.use(errorHandler());

// JSON Body Parser Configuration
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// // Request Throttler
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 30 * 1000, // 1/2 minute
    max: 100 // limit each IP to 100 requests per windowMs (1/2 minute)
});
app.use(limiter);

// Allow CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
    next();
});

app.get('/api/bakery/items', (req: any, res) => {
    res.status(200).send(BAKERY_ITEMS);
});

app.get('/api/bakery/images/muffin', (req: any, res) => {
    res.set({
        "Cache-Control": "public, max-age=86400",
        "Expires": new Date(Date.now() + 86400000).toUTCString()
    }).status(200).sendFile(FS_ITEM_MUFFIN);
});

app.get('/api/bakery/images/donut', (req: any, res) => {
    res.set({
        "Cache-Control": "public, max-age=86400",
        "Expires": new Date(Date.now() + 86400000).toUTCString()
    }).status(200).sendFile(FS_ITEM_DONUT);
});

app.get('/api/bakery/images/pie', (req: any, res) => {
    res.set({
        "Cache-Control": "public, max-age=86400",
        "Expires": new Date(Date.now() + 86400000).toUTCString()
    }).status(200).sendFile(FS_ITEM_PIE);
});

app.get('/api/bakery/images/cupcake', (req: any, res) => {
    res.set({
        "Cache-Control": "public, max-age=86400",
        "Expires": new Date(Date.now() + 86400000).toUTCString()
    }).status(200).sendFile(FS_ITEM_CUPCAKE);
});

app.get('/api/bakery/images/croissant', (req: any, res) => {
    res.set({
        "Cache-Control": "public, max-age=86400",
        "Expires": new Date(Date.now() + 86400000).toUTCString()
    }).status(200).sendFile(FS_ITEM_CROISSANT);
});

app.get('/api/bakery/order', (req: any, res) => {
    db.prepare(GET_ORDERS_SQL).run().all((err, rows) => {
        if (!err) {
            res.status(200).send({
                msg: "Successfully got the latest orders!",
                messages: rows
            });
        } else {
            res.status(500).send({
                msg: "The operation failed. The error is provided below. This may be server malfunction; check that your request is valid, otherwise contact CS571 staff.",
                error: err
            });
        }
    });
});

app.post('/api/bakery/order', (req: any, res) => {
    const strNumMuffin = req.body.muffin;
    const strNumDonut = req.body.donut;
    const strNumPie = req.body.pie;
    const strNumCupcake = req.body.cupcake;
    const strNumCroissant = req.body.croissant;
    const refCode = req.body.refCode;
    if (refCode && refCode in REFCODE_ASSOCIATIONS) {
        const username = REFCODE_ASSOCIATIONS[refCode].split("@wisc.edu")[0];
        if (isInt(strNumMuffin) && isInt(strNumDonut) && isInt(strNumPie) && isInt(strNumCupcake) && isInt(strNumCroissant)) {
            const numMuffin = parseInt(strNumMuffin);
            const numDonut = parseInt(strNumDonut);
            const numPie = parseInt(strNumPie);
            const numCupcake = parseInt(strNumCupcake);
            const numCroissant = parseInt(strNumCroissant);


            if (numMuffin <= 144 && numDonut <= 64 && numPie <= 16 && numCupcake <= 32 && numCroissant <= 48 && numMuffin >= 0 && numDonut >= 0 && numPie >= 0 && numCupcake >= 0 && numCroissant >= 0 && numMuffin + numDonut + numPie + numCupcake + numCroissant > 0) {
                db.prepare(CREATE_ORDER_SQL).get(username, numMuffin, numDonut, numPie, numCupcake, numCroissant, (err: any, resp: any) => {
                    if (!err) {
                        res.status(200).send({
                            msg: "Successfully made order!",
                            id: resp.id,
                            placedOn: resp.placedOn
                        });
                    } else {
                        res.status(500).send({
                            msg: "The operation failed. The error is provided below. This may be server malfunction; check that your request is valid, otherwise contact CS571 staff.",
                            error: err
                        });
                    }
                });
            } else {
                res.status(413).send({
                    msg: 'You can only order between 0 and the upper bound of each type, and you must order something!'
                })
            }
        } else {
            res.status(400).send({
                msg: 'A request must contain integers \'muffin\', \'donut\', \'pie\', \'cupcake\', and \'croissant\''
            })
        }
    } else {
        if (!refCode || refCode.startsWith('bid_')) {
            res.status(401).send({
                msg: 'An invalid refCode was provided.'
            });
        } else {
            res.status(401).send({
                msg: 'An invalid refCode was provided. Did you forget to include \'bid_\'?'
            });
        }
    }
});

// Error Handling
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err)
    let datetime: Date = new Date();
    let datetimeStr: string = `${datetime.toLocaleDateString()} ${datetime.toLocaleTimeString()}`;
    console.log(`${datetimeStr}: Encountered an error processing ${JSON.stringify(req.body)}`);
    res.status(500).send({
        "error-msg": "Oops! Something went wrong. Check to make sure that you are sending a valid request. Your recieved request is provided below. If it is empty, then it was most likely not provided or malformed. If you have verified that your request is valid, please contact the CS571 staff.",
        "error-req": JSON.stringify(req.body),
        "date-time": datetimeStr
    })
});

// Open Server for Business
app.listen(port, () => {
    console.log(`CS571 API :${port}`)
});

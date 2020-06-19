const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const { elasticItemsConnection } = require("./elastic");

require("dns");
require("dnscache")({ "enable": true, "ttl": 300, "cachesize": 1000 });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const { getItems } = require("./mongoServer");

const app = express();

if (process.env.NODE_ENV === "DEVELOPMENT") {
    app.use(morgan("dev"));
}

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec, false, { docExpansion: "none" }));

const SparkMD5 = require("spark-md5");
const hashing = (body) => ({
    body,
    headers: {
        "Request-Hash": SparkMD5.hash(JSON.stringify(body))
    }
});

async function searchPhrase (connection, data) {
    const { conditions } = data;
    const myjson = {
        index: connection.index,
        type: "_doc",
        ...hashing({
            query: {
                query_string: {
                    query: conditions.query
                }
            }
        })
    };

    return await connection.client.search(myjson);
}

/**
 * @swagger
 * /items/search:
 *   get:
 *     tags:
 *       - Search Items
 *     summary: Search Items
 *     description: 'Search Items'
 *     operationId: getSystemData
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: q
 *         in: query
 *         description: query string
 *         required: true
 *     responses:
 *       '200':
 *         description: Successful operation
 *         schema:
 *            $ref: '#/definitions/response'
 *
 *       '400':
 *         description: Missed Parameter(s)
 *         schema:
 *            $ref: '#/definitions/responseError'
 *
 *       '404':
 *         description: Wrong URL
 *         schema:
 *            $ref: '#/definitions/responseError'
 */

app.get("/items/search", async (req, res) => {
    let response = {
        "status": "OK",
        items: []
    };
    if (!req.query.q) {
        return res.status(200).json(response);
    }
    const elasticConnection = elasticItemsConnection;
    // conditions
    const conditions = new function (query) {
        if (query.q && query.q.trim()) this.query = "*" + query.q.trim() + "*";
    }(req.query);

    const result = await searchPhrase(elasticConnection, {
        conditions
    });
    const hits = (result.hits && result.hits.hits) || [];

    const itemsIds = [];
    if (!hits.length) {
        return res.status(200).json(response);
    }
    hits.forEach((doc) => {
        itemsIds.push(mongoose.mongo.ObjectId(doc._source.id));
    });
    const items = await getItems({ itemsIds });

    return res.status(200).json(
        {
            "status": "OK",
            items: items || []
        });
});

app.use("/", async (req, res) => {
    res.status(404).send({
        "message": "Bad request"
    });
});

app.listen(process.env.SERVER_PORT || 3003);

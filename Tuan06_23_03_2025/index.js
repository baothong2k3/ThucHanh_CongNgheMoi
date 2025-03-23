const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');

const { DynamoDBClient, ScanCommand, PutItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");

const config = {
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
};

const client = new DynamoDBClient(config);

const tableName = 'SanPham';

app.get('/', async (req, res) => {
    const params = {
        TableName: tableName,
    };

    try {
        const data = await client.send(new ScanCommand(params));
        return res.render('index', { SanPham: data.Items });
    } catch (err) {
        console.error("Error scanning DynamoDB table:", err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/', async (req, res) => {
    const { ma_sp, ten_sp, so_luong } = req.body;

    const params = {
        TableName: tableName,
        Item: {
            "ma_sp": { S: ma_sp },
            "ten_sp": { S: ten_sp },
            "so_luong": { N: so_luong.toString() }
        }
    };

    try {
        await client.send(new PutItemCommand(params));
        return res.redirect("/");
    } catch (err) {
        console.error("Error putting item into DynamoDB table:", err);
        return res.status(500).send('Internal Server Error');
    }
});

app.post('/delete', async (req, res) => {
    let { ma_sp } = req.body;

    if (!Array.isArray(ma_sp)) {
        ma_sp = [ma_sp];
    }

    const deleteRequests = ma_sp.map(id => ({
        DeleteRequest: {
            Key: {
                "ma_sp": { S: id }
            }
        }
    }));

    const params = {
        RequestItems: {
            [tableName]: deleteRequests
        }
    };

    try {
        await client.send(new BatchWriteItemCommand(params));
        return res.redirect("/");
    } catch (err) {
        console.error("Error deleting items from DynamoDB table:", err);
        return res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
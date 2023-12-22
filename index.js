const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send('Hello Vai')
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.72lvwez.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const taskCollection = client.db('TasksDB').collection('taskCollections')
        const completedCollection = client.db('TasksDB').collection('completed')

        app.get('/tasks', async (req, res) => {
            try {
                const select = req.query.select;
                const email = req.query.email
                if (select === 'All' || select === '') {
                    const result = await taskCollection.find({ email: email }).toArray()
                    res.send(result)
                }
                else {
                    const result = await taskCollection.find({ priority: select, email: email }).toArray()
                    res.send(result)
                }
            }
            catch(err){
                console.log(err)
            }
        })
        app.patch('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const doc = req.body;
            const updatedoc = {
                $set: {
                    status: doc.status
                }
            }
            const result = await taskCollection.updateOne(query, updatedoc)
            res.send(result)
        })

        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.get('/taskcount', async (req, res) => {
            const email = req.query.email
            const todoCount = await taskCollection.countDocuments({ email: email })
            const completedCount = await completedCollection.countDocuments({ email: email })
            const ongoing = await taskCollection.countDocuments({ email: email, status: 'ongoing' })
            res.send({ todoCount, completedCount, ongoing })
        })

        app.post('/tasks', async (req, res) => {
            const taskForm = req.body
            const result = await taskCollection.insertOne(taskForm)
            res.send(result)
        })

        app.get('/completed', async (req, res) => {
            const email = req.query.email;
            const result = await completedCollection.find({ email: email }).toArray()
            res.send(result)
        })

        app.post('/completed', async (req, res) => {
            const result = await completedCollection.insertOne(req.body);
            res.send(result)
        })

        app.get('/ongoing', async (req, res) => {
            const email = req.query.email;
            const result = await taskCollection.find({ email: email, status: 'ongoing' }).toArray()
            res.send(result)
        })

        app.delete('/completed/:id', async (req, res) => {
            const id = req.params.id;
            const result = await completedCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log('server listening on ', port)
})
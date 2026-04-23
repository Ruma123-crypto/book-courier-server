const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT||3000


app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l7oz43b.mongodb.net/books?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Wellcome Ouer BookCourier Services')
})



async function run() {
  try {
   
    await client.connect();
    
 const db = client.db("books");
    const booksCollection = db.collection("books");


// books related apis

// get books
app.get("/books", async (req, res) => {
  const result = await booksCollection
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});
// latest book get
app.get("/books/latest", async (req, res) => {
  const result = await booksCollection
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});
    // book post related apis
    app.post("/books", async (req, res) => {
  const book = req.body;
  book.createdAt = new Date();
  const result = await booksCollection.insertOne(book);
   res.send(result);
});
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Wellcome Ouer BookCourier Services on port ${port}`)
})  
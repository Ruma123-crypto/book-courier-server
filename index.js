const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT||3000
const stripe = require('stripe')(process.env.STRIPE_SECRET);

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
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");



    // user related apis

    app.post("/users", async (req, res) => {
  const user = req.body;

  const filter = { email: user.email };

  const updateDoc = {
    $set: {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date(),
    },
  };

  const options = { upsert: true };

  const result = await usersCollection.updateOne(
    filter,
    updateDoc,
    options
  );

  res.send(result);
});
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


// Show Book By id
app.get("/books/:id", async (req, res) => {
  const id = req.params.id;

  const result = await booksCollection.findOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});


// order related api

app.post("/orders", async (req, res) => {
  const order = req.body;

  order.status = "pending";
  order.paymentStatus = "unpaid";
  order.createdAt = new Date();

  const result = await ordersCollection.insertOne(order);
  res.send(result);
});


// order find get
app.get("/orders", async (req, res) => {
  const email = req.query.email;

  const result = await ordersCollection
    .find({ userEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(result);
});


// payment order
app.post("/orders-payment-checkout-session", async (req, res) => {
  const paymentInfo = req.body;

  const amount = parseInt(paymentInfo.cost) * 100;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "USD",
          unit_amount: amount,
          product_data: {
            name: paymentInfo.bookTitle,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      orderId: paymentInfo.orderId,
      bookTitle: paymentInfo.bookTitle,
    },
    customer_email: paymentInfo.senderEmail,
    
    success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancel`,
  });

  res.send({ url: session.url });
});

app.post("/payment-success", async (req, res) => {
  try {
    const { orderId } = req.body;

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: "paid",
          status: "processing", 
        },
      }
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Payment update failed" });
  }
});

// payemnt cancel
app.patch("/orders/cancel/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
           paymentStatus: "cancelled"
        },
      }
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Failed to cancel order" });
  }
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
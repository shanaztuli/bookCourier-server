require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const stripe = require("stripe")(process.env.STRIPE_SECRET);


const crypto = require("crypto");
const port = process.env.PORT || 3000;


//min

const admin = require("firebase-admin");

// const serviceAccount = require("./bookcourier-firebase-adminsdk.json");


//MIN


const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
// middleware
app.use(
  cors({
    origin: "https://bookcourier12.netlify.app",
    credentials: true,
  })
);

app.use(express.json());

// jwt middlewares
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Invalid token" });
  }
};



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db("bookDB");
    const booksCollection = db.collection("books");
 const ordersCollection = db.collection("orders");
 const wishlistCollection = db.collection("wishlist");
 const usersCollection = db.collection("users");
 const paymentsCollection = db.collection("payments");
 const reviewsCollection = db.collection("reviews");


    const verifyAdmin = async (req, res, next) => {
      const user = await usersCollection.findOne({ email: req.user.email });

      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "Admin only access" });
      }

      next();
    };

    const verifyLibrarian = async (req, res, next) => {
      const user = await usersCollection.findOne({ email: req.user.email });

      if (!user || user.role !== "librarian") {
        return res.status(403).send({ message: "Librarian only access" });
      }

      next();
    };
   





    //book related apis here
    app.get("/books", async (req, res) => {
      const result = await booksCollection
        .find({ status: "published" })
        .toArray();
      res.send(result);
    });

    app.get("/books/latest", async (req, res) => {
      const result = await booksCollection
        .find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray();
      res.send(result);
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const result = await booksCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //
    app.post("/books", async (req, res) => {
      const book = req.body;

      if (!book.title || !book.author || !book.price || !book.librarianEmail) {
        return res.status(400).send({ message: "Required fields missing" });
      }

      const newBook = {
        title: book.title,
        author: book.author,
        description: book.description || "",
        image: book.image || "",
        price: Number(book.price),
        category: book.category || "",
        isbn: book.isbn || "",
        pages: Number(book.pages) || 0,
        language: book.language || "",
        publisher: book.publisher || "",
        rating: book.rating || 0,
        reviewsCount: book.reviewsCount || 0,
        status: book.status || "unpublished",
        librarianEmail: book.librarianEmail,
        createdAt: new Date(),
      };

      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    });
    //
    app.get("/books/librarian/:email", async (req, res) => {
      const email = req.params.email;

      const books = await booksCollection
        .find({ librarianEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(books);
    });
    //
    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.send(result);
    });

    //get role from  user collection

    app.post("/users", async (req, res) => {
      const { name, email, role } = req.body;
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) return res.send(existingUser);
      const newUser = {
        name,
        email,
        role: role || "user",
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/user/role", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "email is required" });

      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).send({ message: "User not Found" });
      res.send({ role: user.role });
    });

    // add to wishlist
    app.post("/wishlist", async (req, res) => {
      const { bookId, userEmail } = req.body;

      const exists = await wishlistCollection.findOne({ bookId, userEmail });

      if (exists) {
        return res.status(400).send({ message: "already Wishlisted" });
      }
      const wishlistItem = { ...req.body, createdAt: new Date() };
      const result = await wishlistCollection.insertOne(wishlistItem);
      res.send(result);
    });

    // Get wishlist by user
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const wishlist = await wishlistCollection
        .find({ userEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(wishlist);
    });

    //orders apis goes here

    app.post("/orders", async (req, res) => {
      const order = req.body;

      if (!order.librarianEmail) {
        return res.status(400).send({ message: "librarianEmail required" });
      }
      order.orderStatus = "pending";
      order.paymentStatus = "unpaid";
      order.createdAt = new Date();
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders/user/:email",verifyFirebaseToken, async (req, res) => {

       if (req.user.email !== req.params.email) {
         return res.status(403).send({ message: "Forbidden" });
       } 

      const email = req.params.email;
      const result = await ordersCollection
        .find({ email })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    app.patch("/orders/cancel/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id), orderStatus: "pending" },
        { $set: { orderStatus: "cancelled" } }
      );

      res.send(result);
    });

    app.patch("/order/pay/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: "paid" } }
      );

      res.send(result);
    });
    //LIBRARIAN APIS

    app.get(
      "/orders/librarian/:email",
      verifyFirebaseToken,
      verifyLibrarian,
      async (req, res) => {
        const email = req.params.email;
    if (req.user.email !== req.params.email) {
   return res.status(403).send({ message: "Forbidden" });
 }
        const orders = await ordersCollection
          .find({ librarianEmail: email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(orders);
      }
    );

    app.patch("/orders/status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const allowed = ["pending", "shipped", "delivered"];
      if (!allowed.includes(status)) {
        return res.status(400).send({ message: "Invalid status" });
      }

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { orderStatus: status } }
      );

      res.send(result);
    });

    //admin apis
    app.get(
      "/admin/users",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const users = await usersCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        res.send(users);
      }
    );
    //
    app.patch(
      "/admin/users/:id/role",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const { role } = req.body;

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } }
        );

        res.send(result);
      }
    );

    //

    app.get(
      "/admin/books",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const books = await booksCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();
          res.send(books);
        } catch (err) {
          res.status(500).send({ message: "Failed to fetch books" });
        }
      }
    );
    //
    app.patch("/admin/books/:id/status", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      try {
        const result = await booksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to update status" });
      }
    });

    //
    app.delete("/admin/books/:id", async (req, res) => {
      const { id } = req.params;

      try {
        // Delete the book
        await booksCollection.deleteOne({ _id: new ObjectId(id) });
      
        await ordersCollection.deleteMany({ bookId: id });
        res.send({ message: "Book and its orders deleted successfully" });
      } catch (err) {
        res.status(500).send({ message: "Failed to delete book" });
      }
    });

    //PAYMENT REALATED APIS

    app.post("/order-checkout-session", async (req, res) => {
      const { orderId, bookTitle, price, email } = req.body;

      if (!orderId || !price || !email) {
        return res.status(400).send({ error: "Missing fields" });
      }

      const amount = Math.round(Number(price) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: bookTitle,
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        metadata: {
          orderId,
        },
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
      });

      res.send({ url: session.url });
    });

    //
    app.patch("/order-payment-success", async (req, res) => {
      const sessionId = req.query.session_id;

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return res.status(400).send({ message: "Payment not completed" });
      }

      const transactionId = session.payment_intent;
      const orderId = session.metadata.orderId;

      const existingPayment = await paymentsCollection.findOne({
        transactionId,
      });

      if (existingPayment) {
        return res.send({
          success: true,
          message: "Payment already recorded",
          transactionId,
        });
      }

      // 2️Update order
      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            paymentStatus: "paid",
            orderStatus: "processing",
          },
        }
      );

      // 3️ Save payment (ONCE)
      const payment = {
        orderId: new ObjectId(orderId),
        email: session.customer_email,
        amount: session.amount_total / 100,
        currency: session.currency,
        transactionId,
        paymentStatus: session.payment_status,
        paidAt: new Date(),
      };

      await paymentsCollection.insertOne(payment);

      res.send({
        success: true,
        transactionId,
      });
    });

    //

    // app.patch("/orders/cancel/:id", async (req, res) => {
    //   const id = req.params.id;

    //   const query = { _id: new ObjectId(id) };
    //   const update = {
    //     $set: {
    //       orderStatus: "cancelled",
    //     },
    //   };

    //   const result = await ordersCollection.updateOne(query, update);
    //   res.send(result);
    // });

    ///current user profile change api

    app.get("/users/profile/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });

      if (!user) return res.status(404).send({ message: "User not found" });

      res.send(user);
    });

    app.patch("/users/profile/:email", async (req, res) => {
      const email = req.params.email;
      const { name, image } = req.body;

      const updateDoc = {
        $set: {
          name,
          image,
          updatedAt: new Date(),
        },
      };

      const result = await usersCollection.updateOne({ email }, updateDoc);
      res.send(result);
    });

    ///inconvience

    //
    app.get("/payments",verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const payments = await paymentsCollection
        .find({ email })
        .sort({ paidAt: -1 })
        .toArray();

      res.send(payments);
    });
//reviews api 
app.get("/reviews/can-review", async (req, res) => {
  const { bookId, email } = req.query;

  if (!bookId || !email) {
    return res.status(400).send({ message: "Missing data" });
  }

  const order = await ordersCollection.findOne({
    bookId,
    email,
    paymentStatus: "paid",
  });

  res.send({ canReview: !!order });
});
//
app.post("/reviews", async (req, res) => {
  const { bookId, rating, review, userEmail, userName } = req.body;

  if (!bookId || !rating || !userEmail) {
    return res.status(400).send({ message: "Required fields missing" });
  }

  const exists = await reviewsCollection.findOne({ bookId, userEmail });
  if (exists) {
    return res.status(400).send({ message: "Already reviewed" });
  }

  const newReview = {
    bookId,
    rating: Number(rating),
    review: review || "",
    userEmail,
    userName,
    createdAt: new Date(),
  };

  await reviewsCollection.insertOne(newReview);

  //  Update book rating
  const reviews = await reviewsCollection.find({ bookId }).toArray();
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await booksCollection.updateOne(
    { _id: new ObjectId(bookId) },
    {
      $set: {
        rating: Number(avgRating.toFixed(1)),
        reviewsCount: reviews.length,
      },
    }
  );

  res.send({ success: true });
});

//
app.get("/reviews/:bookId", async (req, res) => {
  const bookId = req.params.bookId;

  const reviews = await reviewsCollection
    .find({ bookId })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(reviews);
});

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Server..");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import express from "express"
const app = express();
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose from "mongoose";
import authRoute from "./routes/auth.js"
import userRoute from "./routes/user.js"
import messageRoute from "./routes/message.js"
import jwt from "jsonwebtoken"
import fs from "fs"
// websocket
import WebSocket, { WebSocketServer } from "ws"

// message model
import Message from "./models/Message.js"
import path from 'path';
const __dirname = path.resolve();

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected");
    } catch (err) {
        console.log(err);
    }
}

mongoose.connection.on("disconnected", () => {
    console.log("mongodb disconnected");
})

//middlewares
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser())
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: [process.env.CLIENT_URL]
}));


// error handling middleware
app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
    });
});


// routes
app.use("/api/auth", authRoute);
app.use('/api/user', userRoute);
app.use("/api/message", messageRoute)

// listening to port
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
    connect();
    console.log(`server is running on port ${port}`);
});

// websocket server
const websocketserver = new WebSocketServer({ server, maxPayload: 128 * 1024 * 1024 });


// websocketserver.on('headers', (headers) => {
//     headers.push('Set-Cookie: ' + cookie_parser.serialize('token', 'test'));
// })

websocketserver.on("connection", (connection, req) => {

    const notifyAboutOnlinePeople = () => {
        [...websocketserver.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...websocketserver.clients].map(c => (
                    { username: c.username, userId: c.userId }
                ))
            }))
        })
    }

    connection.isAlive = true;

    // pinging the connection every 5 seconds
    connection.timer = setInterval(() => {
        connection.ping();

        // after 5s internal we will say the user is offline
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log('dead');
        }, 1000);
    }, 5000)

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    })

    // read username and user id using request headers token
    const token = req.headers['sec-websocket-protocol']

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
            if (err) throw err;
            const { username, userId } = user;
            connection.userId = userId;
            connection.username = username;
        })
    }

    connection.on("message", async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, sender,text, file } = messageData;

        let fileName = null;
        if (file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];

            fileName = Date.now() + '.' + ext;
            const path = `${__dirname}/uploads/${fileName}`;

            // the file.data means the actual data we get from the frontend
            // the frontend data is encoded with base64 format but in our backend we need
            // to convert it and decode it into buffer data inorder save it and use it
            const bufferData = new Buffer(file.data.split(",")[1], "base64");

            fs.writeFile(path, bufferData, () => {
                console.log('file saved => ', fileName);
            });
        }

        if (recipient && (text || file)) {
            // saving the message in our database first
            const messageDoc = await Message.create({
                sender,
                recipient,
                text,
                file: file ? fileName : null
            });


            // recipient means receiver , so we will now make a filtered array as the reciever client can be
            // connected in both mobile and pc so to make it realtime on both device we have to send asynchronously
            // to both devices following indicates that
            [...websocketserver.clients]
                .filter(c => {
                    if(c.userId === recipient){
                        return c;
                    }

                    if(c.userId === sender){
                        return c;
                    }
                })
                .forEach(c => {
                    c.send(JSON.stringify({
                        text,
                        sender,
                        recipient,
                        file: file ? fileName : null,
                        _id: messageDoc._id
                    }))
                });
        }
    });

    // notify everyone about online people when someone connects
    notifyAboutOnlinePeople();
})

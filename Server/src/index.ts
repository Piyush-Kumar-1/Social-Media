import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { Post } from "./enitity/Post";
import { User } from "./enitity/User";
import { hello } from "./resolver/hello";
import { PostResolver } from "./resolver/post";
import { UserResolver } from "./resolver/user";
import path from "path";
import { Updoot } from "./enitity/Updoot";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "lireddit",
    username: "postgres",
    password: "ENTER YOUR PASSWORD",
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, "./migrations/*")],
  });

  await conn.runMigrations();

  const app = express();
  app.use(cors({ origin: "http://localhost:3000", credentials: true }));

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        sameSite: "lax",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        secure: false,
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [hello, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000);
};

main().catch((err) => console.error(err));

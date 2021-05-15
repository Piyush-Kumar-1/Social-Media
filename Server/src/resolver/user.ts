import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { User } from "../enitity/User";
import argon2 from "argon2";
import { sendEmail } from "../util/sendEmail";
import { v4 } from "uuid";

@InputType()
class UsernamePasswordInput {
  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  password!: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ email });
    if (!user) {
      return true;
    }
    const token = v4();
    await redis.set("FORGOT_PASSWORD" + token, user.id, "ex", 1000 * 60 * 60);
    sendEmail(
      email,
      '<a href="localhost:3000/change-password/' +
        token +
        '">Reset Password</a>'
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Ctx() { redis, req }: MyContext,
    @Arg("password") password: string,
    @Arg("token") token: string
  ): Promise<UserResponse> {
    console.log(token, password);

    const id = await redis.get("FORGOT_PASSWORD" + token);
    if (!id) {
      return {
        errors: [
          {
            field: "token",
            message: "Invalid or expired token",
          },
        ],
      };
    }
    const idnum = parseInt(id);
    const user = await User.findOne({ id: idnum });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired or does not exists",
          },
        ],
      };
    }
    if (password.length < 3) {
      return {
        errors: [
          {
            field: "password",
            message: "Lenth must be greater then 2",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(password);
    try {
      await User.update({ id: idnum }, { password: hashedPassword });
    } catch (error) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired or does not exists",
          },
        ],
      };
    }
    redis.del("FORGOT_PASSWORD" + token);
    req.session.userId = idnum;
    return { user };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    console.log(await User.findOne({ id: req.session.userId }));

    return User.findOne({ id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    let user;
    const email = await User.findOne({ email: options.email });

    if (email) {
      return {
        errors: [
          {
            field: "email",
            message: "email already exists",
          },
        ],
      };
    }

    if (!options.email.includes("@" && ".")) {
      return {
        errors: [
          {
            field: "email",
            message: "invalid email",
          },
        ],
      };
    }
    const username = await User.findOne({ username: options.username });
    if (username) {
      return {
        errors: [
          {
            field: "username",
            message: "alreay exists",
          },
        ],
      };
    }
    if (options.username.length < 3) {
      return {
        errors: [
          {
            field: "username",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    if (options.username.includes("@")) {
      return {
        errors: [
          {
            field: "username",
            message: "invalid username",
          },
        ],
      };
    }

    if (options.password.length < 3) {
      return {
        errors: [
          {
            field: "password",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    try {
      user = await User.create({
        email: options.email,
        username: options.username,
        password: hashedPassword,
      }).save();
    } catch (error) {
      user = undefined;
      if (error.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "already exists",
            },
          ],
        };
      }
    }
    req.session.userId = user!.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("password") password: string,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    let user;
    if (usernameOrEmail.includes("@")) {
      user = await User.findOne({ email: usernameOrEmail });
    } else {
      user = await User.findOne({ username: usernameOrEmail });
    }
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "user not found",
          },
        ],
      };
    }
    const verify = await argon2.verify(user?.password, password);
    if (!verify) {
      return {
        errors: [
          {
            field: "password",
            message: "Invalid password",
          },
        ],
      };
    }
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    res.clearCookie("qid");
    return new Promise((res) =>
      req.session.destroy((err) => {
        if (err) {
          res(false);
          return;
        }
        res(true);
      })
    );
  }
}

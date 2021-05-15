import { Query, Resolver } from "type-graphql";

@Resolver()
export class hello {
  @Query(() => String)
  hello() {
    return "hello";
  }
}

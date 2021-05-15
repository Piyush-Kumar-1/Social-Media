import React, { FC } from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import NavLink from "next/link";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/button";
import { useRouter } from "next/router";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: FC<NavBarProps> = ({}): any => {
  const [{ fetching }, logout] = useLogoutMutation();
  const [{ data, fetching: mefetching }] = useMeQuery({
    pause: isServer(),
  });
  const router = useRouter();
  let body = null;
  if (mefetching) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <Link mr="10px">
          <NavLink href="/login">Login</NavLink>
        </Link>
        <NavLink href="/register">register</NavLink>
      </>
    );
  } else {
    body = (
      <>
        {data?.me?.username}
        <Button
          isLoading={fetching}
          onClick={() => {
            logout();
            router.replace("/");
          }}
        >
          Logout
        </Button>
      </>
    );
  }

  return (
    <Flex bgColor="tan" p="10px">
      <Box ml="auto">{body}</Box>
    </Flex>
  );
};

import { withUrqlClient } from "next-urql";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import Layout from "../components/layout";
import React, { useState } from "react";
import { Button } from "@chakra-ui/button";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });
  function Feature({ title, desc }: any) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" mb="15px">
        <Heading fontSize="xl">{title}</Heading>
        <Text mt={4}>{desc}</Text>
      </Box>
    );
  }

  if (fetching) {
    <div>Loading</div>;
  }

  if (!fetching && !data) {
    return <div>Loading failed please refresh</div>;
  }

  return (
    <Layout>
      <Flex>
        <NextLink href="/create-post">
          <Link mb="20px" m="auto" fontSize="2xl">
            Create Post
          </Link>
        </NextLink>
      </Flex>
      {!data && fetching
        ? null
        : data!.posts.posts?.map((item) => (
            <Stack spacing={1}>
              <Feature title={item.title} desc={item.textSnippet} />
            </Stack>
          ))}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            m="auto"
            my="10px"
            isLoading={fetching}
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);

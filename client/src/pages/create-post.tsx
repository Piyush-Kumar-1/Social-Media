import { Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { FC } from "react";
import { InputField } from "../components/InputField";
import Layout from "../components/layout";
import { useCreatePostMutation, useMeQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const CreatePost: FC<{}> = ({}) => {
  const router = useRouter();
  const [{ data, fetching }] = useMeQuery();
  const [, createPost] = useCreatePostMutation();

  if (fetching) {
    return null;
  }
  if (!data?.me?.username && !fetching) {
    router.replace("/login?next=" + router.pathname);
    return null;
  }
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (values.title.length < 3) {
            return setErrors({ title: "Length must be more than 2" });
          } else if (values.text.length < 3) {
            return setErrors({ text: "Length must be more than 2" });
          }
          const { error } = await createPost({ input: values });
          if (!error) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" label="Title" placeholder="Title" />
            <InputField textarea name="text" label="Text" placeholder="Text" />
            <Flex>
              <Button
                type="submit"
                colorScheme="teal"
                mt="10px"
                isLoading={isSubmitting}
              >
                Create Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(CreatePost);

import { Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React, { FC } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Register: FC<{}> = ({}) => {
  const router = useRouter();
  const [, register] = useRegisterMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "", username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await register({ options: values });
          if (response.data?.register.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register.user) {
            router.replace("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="email" label="Email" placeholder="email" />
            <InputField
              name="username"
              label="Username"
              placeholder="username"
            />

            <InputField
              name="password"
              label="Password"
              placeholder="password"
              type="password"
            />
            <Button
              type="submit"
              colorScheme="teal"
              mt="10px"
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);

import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export function ResetPasswordTemplate(props: { link: string }) {
  const { link } = props;

  return (
    <Html>
      <Tailwind>
        <Head>
          <title>Verify Email</title>
        </Head>
        <Body>
          <Container>
            <Section>
              <Text>
                <h1
                  style={{
                    color: '#282c34',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginLeft: '150px',
                  }}
                >
                  Password Reset
                </h1>
                <Text
                  style={{
                    color: '#282c34',
                    fontSize: '16px',
                  }}
                >
                  If you&apos;ve lost your password or wish to reset it use the
                  below to get started.
                </Text>
                <Button
                  href={link}
                  style={{
                    color: '#ffffff',
                    padding: '10px 20px',
                    marginTop: '20px',
                    border: 'none',
                    borderRadius: '5px',
                    marginLeft: '150px',
                    backgroundColor: '#282c34',
                  }}
                >
                  Reset Your Password
                </Button>
                <Text
                  style={{
                    color: '#4b5563',
                    fontSize: '12px',
                  }}
                >
                  If you did not request a password reset, you can safely ignore
                  this email. Only a person with access to your email can reset
                  your account password.
                </Text>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

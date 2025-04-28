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

export function Email(props: { link: string }) {
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
                  Email Verification
                </h1>
                <Text
                  style={{
                    color: '#282c34',
                  }}
                >
                  You&apos;re almost set to start using the App. Simply click
                  link below to verify your email address and get started. The
                  link expires in 48 hours.
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
                  Verify My Email Adress
                </Button>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default Email;

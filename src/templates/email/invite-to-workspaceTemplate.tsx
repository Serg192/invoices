import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from 'react';

export function InviteToWorkspaceTemplate(props: {
  data: any;
  username?: string;
  workspaceName?: string;
  userPfp?: string;
  workspacePfp?: string;
  inviterUsername?: string;
  inviterEmail?: string;
  link: string;
}) {
  const {
    data,
    username,
    workspaceName,
    userPfp,
    workspacePfp,
    inviterUsername,
    inviterEmail,
    link,
  } = props;

  const previewText = `Join ${inviterUsername} on Invoice app`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]"></Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Join <strong>{workspaceName}</strong> on{' '}
              <strong>Invoice app</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello, {username}
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterUsername}</strong> (
              <Link
                href={`mailto:${inviterEmail}`}
                className="text-blue-600 no-underline"
              >
                {inviterEmail}
              </Link>
              ) has invited you to the <strong>{workspaceName}</strong> team on{' '}
              <strong>Invoice app</strong>.
            </Text>
            <Section>
              <Row>
                <Column align="right"></Column>
                <Column align="center"></Column>
                <Column align="left"></Column>
              </Row>
            </Section>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                href={link}
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
              >
                Join the team
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link href={link} className="text-blue-600 no-underline">
                {link}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

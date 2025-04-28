import * as React from 'react';

export function WeeklyReportTemplate(props: any) {
  const {
    workspaceName,
    newMembers,
    emailsReceived,
    invoicesHandled,
    emailsTotal,
    invoicesTotal,
  } = props;

  return (
    <>
      {`${workspaceName} workspace`}
      <br></br>
      {`${newMembers} new users in the last week`}
      <br></br>
      {`${emailsReceived} emails received in the last week`}
      <br></br>
      {`${invoicesHandled} invoices handled in the last week`}
      <br></br>
      {`${emailsTotal} emails in total`}
      <br></br>
      {`${invoicesTotal} invoices in total`}
    </>
  );
}

export default WeeklyReportTemplate;

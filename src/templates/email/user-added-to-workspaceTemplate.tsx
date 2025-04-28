import * as React from 'react';

export function UserAddedToWorkspace(props: any) {
  const { username, userEmail, workspaceName } = props;
  return <>{`${username} <${userEmail}> joined ${workspaceName} workspace`}</>;
}

export default UserAddedToWorkspace;

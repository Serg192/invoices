/* 
Password requirements:
1) Min 10 characters len
2) Min 1 uppercase letters
3) Min 1 lowercase letters
4) Min 1 special character 
5) Min 1 numbers
*/
export const passwordRegex =
  /^(?=.*[A-Z])(?=.*[!@#$&%^_+=()\\\[\]{};:<>.,|?\-\/*])(?=.*[0-9])(?=.*[a-z]).{10,}$/gm;

export const dateFilterRegex = /^\d{4}-\d{2}-\d{2}$/;

//
export const ourDomainEmailRegex = new RegExp(
  `@${process.env.WORKSPACE_DOMAIN}$`,
  'gm',
);

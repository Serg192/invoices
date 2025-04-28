import { HttpStatus } from '@nestjs/common';

enum ECustomErrors {
  INVALID_TOKEN = 403,
  BAD_REQUEST = 400,
  UNKNOWN_ERR = 700,
}

export const ECustomError = {
  ...HttpStatus,
  ...ECustomErrors,
};

export const publicAccess = {
  security: [],
};

export const bearerAuth = {
  security: [{ BearerAuth: [] }],
};

export const cookieAuth = {
  security: [{ CookieAuth: [] }],
};

export const bearerOrCookieAuth = {
  security: [{ BearerAuth: [] }, { CookieAuth: [] }],
};

export const bearerAndCookieAuth = {
  security: [{ BearerAuth: [], CookieAuth: [] }],
};

export const optionalBearerAuth = {
  security: [{}, { BearerAuth: [] }],
};

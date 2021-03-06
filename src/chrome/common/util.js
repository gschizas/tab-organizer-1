import * as list from "../../util/list";
import * as async from "../../util/async";
import { chrome } from "../../common/globals";
import { crash } from "../../util/assert";


// TODO this can be made faster if it was given an index to start at
export const update_indexes = (x) => {
  list.each(x, (x, index) => {
    x.index = index;
  });
};

export const round = (x) =>
  (x == null
    ? undefined
    : Math["round"](x));


// TODO test this
export const check_error = () => {
  if (chrome["runtime"]["lastError"] != null) {
    return new Error(chrome["runtime"]["lastError"]["message"]);
  } else {
    return null;
  }
};

export const throw_error = () => {
  const err = check_error();
  if (err !== null) {
    crash(err);
  }
};

export const async_chrome = (f) => {
  const out = async.make();

  f((...value) => {
    const err = check_error();

    if (err === null) {
      if (value["length"] === 1) {
        async.success(out, value[0]);
      } else {
        async.success(out, value);
      }

    } else {
      async.error(out, err);
    }
  });

  return out;
};

// TODO remove this once Chrome bugs 357568 and 143281 are fixed
export const callback = (f) => {
  return (...args) => {
    try {
      return f(...args);
    } catch (e) {
      setTimeout(() => {
        crash(e);
      }, 0);
    }
  };
};

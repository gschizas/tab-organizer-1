import { Timer } from "../../util/time";
import { async } from "../../util/async";
import { async_chrome, throw_error } from "../common/util";
import { assert } from "../../util/assert";

const print = (timer, ...args) => {
  const x = timer.diff();
  if (x > 100) {
    console["warn"](...args, "(" + x + "ms)");
  } else {
    console["debug"](...args, "(" + x + "ms)");
  }
};

// TODO this is O(n)
const serialize = (value) => {
  if (value === null ||
      value === true ||
      value === false ||
      typeof value === "number" ||
      typeof value === "string") {
    return value;

  } else if (Array["isArray"](value)) {
    return value["map"](serialize);

  } else if (typeof value === "object") {
    if (typeof value["toJSON"] === "function") {
      return serialize(value["toJSON"]());

    } else {
      const o = {};

      // TODO function for this ?
      // TODO hasOwnProperty
      // TODO is this slow ?
      for (let s in value) {
        o[s] = serialize(value[s]);
      }

      return o;
    }

  } else {
    throw new Error("Invalid object: " + value);
  }
};

export const init_db = async(function* () {
  const timer = new Timer();

  const db = yield async_chrome((callback) => {
    chrome["storage"]["local"]["get"](null, callback);
  });

  timer.done();

  const get = (key, def) => {
    if (key in db) {
      return db[key];
    } else {
      return def;
    }
  };

  const set = (key, value) => {
    const timer = new Timer();

    const svalue = serialize(value);

    db[key] = svalue;

    // TODO test whether we need to batch this or not
    chrome["storage"]["local"]["set"]({ [key]: svalue }, () => {
      throw_error();
      timer.done();
      print(timer, "Wrote key to db: " + key);
    });
  };

  const remove = (key) => {
    if (key in db) {
      const timer = new Timer();

      delete db[key];

      // TODO test whether we need to batch this or not
      chrome["storage"]["local"]["remove"](key, () => {
        throw_error();
        timer.done();
        print(timer, "Removed key from db: " + key);
      });

    } else {
      throw new Error("Key not found: " + key);
    }
  };

  print(timer, "Initialized db:", db);

  return {
    get,
    set,
    remove
  };
});
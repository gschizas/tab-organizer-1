import * as dom from "../../../util/dom";
import * as list from "../../../util/list";
import * as async from "../../../util/async";
import * as record from "../../../util/record";
import * as mutable from "../../../util/mutable";
import { style_changed, style_dropdown } from "./common";
import { init as init_options } from "../../sync/options";


export const init = async.all([init_options],
                              ({ get, get_default }) => {

  const get_values1 = (out, children) => {
    list.each(children, (child) => {
      if (child.separator) {
        // Do nothing

      } else if (child.group != null) {
        get_values1(out, child.children);

      } else {
        record.insert(out, child.value, child.name);
      }
    });
  };

  const get_values = (children) => {
    const out = record.make();
    get_values1(out, children);
    return out;
  };

  const dropdown_children = (children) =>
    // TODO a little hacky
    list.map(children, (info) =>
      (info.separator
        ? dom.optgroup((e) => [])
        : (info.group != null
            ? dom.optgroup((e) => [
                dom.set_label(e, mutable.always(info.group)),
                dom.children(e, dropdown_children(info.children))
              ])
            : dom.option((e) => [
                dom.set_value(e, mutable.always(info.value)),
                dom.set_label(e, mutable.always(info.name))
              ]))));

  const dropdown = (name, children) => {
    const opt = get(name);
    const def = get_default(name);

    const values = get_values(children);

    return dom.select((e) => [
      dom.add_style(e, style_dropdown),
      dom.toggle_style(e, style_changed, mutable.map(opt, (x) => x !== def)),

      dom.set_tooltip(e, mutable.always("Default: " + record.get(values, def))),

      // TODO a little hacky
      dom.children(e, dropdown_children(children)),

      dom.set_value(e, opt),

      dom.on_change(e, (value) => {
        // TODO this causes the DOM node to be updated twice
        mutable.set(opt, value);
      })
    ]);
  };


  return async.done({ dropdown });
});

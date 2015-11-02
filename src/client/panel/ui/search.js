import * as dom from "../../../util/dom";
import * as async from "../../../util/async";
import * as ref from "../../../util/ref";
import { on_crash } from "../../../util/assert";
import { value } from "../search/search";
import { top_inset } from "./common";
import { init as init_dragging } from "../logic/dragging";


const failed = ref.make(null);

on_crash((e) => {
  ref.set(failed, e);
});


export const init = async.all([init_dragging],
                              ({ dragging_started }) => {

  const style_search = dom.make_style({
    "cursor": ref.map(dragging_started, (x) =>
                (x === null ? "auto" : null)),

    "padding-top": ref.always("1px"),
    "padding-bottom": ref.always("2px"),
    "padding-left": ref.always("2px"),
    "padding-right": ref.always("2px"),

    "height": ref.always("100%"),

    "background-color": ref.map_null(failed, (failed) => dom.hsl(5, 100, 90)),

    "box-shadow": ref.always("inset 0px 0px 1px 0px " + top_inset)
  });


  const search = () =>
    dom.search((e) => [
      dom.add_style(e, dom.stretch),
      dom.add_style(e, style_search),

      // TODO this isn't quite correct
      dom.set_tooltip(e, ref.map_null(failed, (failed) => failed["message"])),

      // TODO a little hacky
      // TODO is this correct ?
      dom.set_value(e, ref.first(value)),

      dom.on_change(e, (x) => {
        ref.set(value, x);
      })
    ]);


  return async.done({ search });
});

import * as dom from "../../../util/dom";
import * as async from "../../../util/async";
import * as mutable from "../../../util/mutable";
import * as stream from "../../../util/stream";
import { init as init_group } from "./group";
import { init as init_options } from "../../sync/options";


export const init = async.all([init_group,
                               init_options],
                              ({ group: ui_group },
                               { get: opt }) => {

  const style_group_list = dom.make_style({
    "width": mutable.always("100%"),

    // TODO really hacky
    // This has to match with the height of the search bar
    "height": mutable.always("calc(100% - 24px)"),

    "padding": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "9px 9px 9px 9px";
      case "grid":
        // TODO this has to match up with the group's "margin"
        return "6px 6px 6px 6px";
      default:
        return "1px 0px 0px 0px";
      }
    }),

    // TODO hack which causes Chrome to not repaint when scrolling
    "transform": mutable.always("translateZ(0)"),

    "overflow": mutable.always("auto"),
  });

  const style_group_children = dom.make_style({
    "overflow": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "grid":
      case "horizontal":
        return "visible";
      default:
        return null;
      }
    }),

    "width": mutable.always("100%"),

    "height": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "grid":
      case "horizontal":
        return "100%";
      default:
        return null;
      }
    }),

    "padding": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "0px 95px 0px 95px"
      default:
        return null;
      }
    })
  });


  const scroll_x = +(localStorage["popup.scroll.x"] || 0);
  const scroll_y = +(localStorage["popup.scroll.y"] || 0);


  // "grid" layout is neither horizontal nor vertical,
  // because it uses "float: left"
  const is_horizontal = mutable.map(opt("groups.layout"), (x) =>
                          (x === "horizontal"));


  const group_list = (groups) =>
    dom.parent((e) => [
      //dom.add_style(e, dom.stretch),
      dom.add_style(e, style_group_list),

      dom.set_scroll(e, {
        // TODO a little hacky
        x: mutable.always(scroll_x),
        // TODO a little hacky
        y: mutable.always(scroll_y)
      }),

      // TODO should it also save the current scroll after using the search box ?
      dom.on_scroll(e, ({ x, y }) => {
        localStorage["popup.scroll.x"] = "" + x;
        localStorage["popup.scroll.y"] = "" + y;
      }),

      // TODO this is pretty hacky, but I don't know a better way to make it work
      dom.children(e, [
        dom.parent((e) => [
          dom.toggle_style(e, dom.row, is_horizontal),
          dom.add_style(e, style_group_children),

          dom.stream(e, stream.map(groups, ui_group))
        ])
      ])
    ]);


  return async.done({ group_list });
});

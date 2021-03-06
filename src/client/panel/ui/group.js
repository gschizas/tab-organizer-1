import * as dom from "../../../util/dom";
import * as async from "../../../util/async";
import * as stream from "../../../util/stream";
import * as record from "../../../util/record";
import * as mutable from "../../../util/mutable";
import { style_texture } from "./common";
import { init as init_tab } from "./tab";
import { init as init_options } from "../../sync/options";
import { init as init_dragging } from "../logic/dragging";


export const init = async.all([init_tab,
                               init_options,
                               init_dragging],
                              ({ tab: ui_tab },
                               { get: opt },
                               { drag_onto_group }) => {

  const animation_group_wrapper = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "width": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "horizontal":
        case "grid":
          return "0px";
        default:
          return null;
        }
      }),

      "opacity": mutable.always("0")
    }
  });

  const animation_group = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "border-width": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "horizontal":
          // TODO a little hacky
          return "1px 0px 1px 0px";
        default:
          return null;
        }
      }),

      "padding": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "horizontal":
          // TODO a little hacky, this needs to match padding-top
          return "3px 0px 0px 0px";
        default:
          return null;
        }
      }),

      "width": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "horizontal":
          return "0px";
        default:
          return null;
        }
      }),
    }
  });

  const animation_group_header = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "height": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "vertical":
          return "0px";
        default:
          return null;
        }
      }),

      // This needs to match the "margin-left" in "tab.js"
      "margin-left": mutable.always("12px"),
    }
  });

  const animation_group_tabs = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "padding-bottom": mutable.map(opt("groups.layout"), (x) => {
        switch (x) {
        case "vertical":
          return "0px";
        default:
          return null;
        }
      }),
    }
  });


  const style_group_wrapper = dom.make_style({
    "overflow": mutable.always("visible"),

    "flex-grow": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "1";
      default:
        return null;
      }
    }),

    "float": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "grid":
        return "left";
      default:
        return null;
      }
    }),

    "width": mutable.latest([
      opt("groups.layout"),
      opt("groups.layout.grid.column")
    ], (layout, col) => {
      switch (layout) {
      case "horizontal":
        // This is the minimum width for the group
        return "110px";

      case "grid":
        return ((1 / col) * 100) + "%";

      default:
        return null;
      }
    }),

    "height": mutable.latest([
      opt("groups.layout"),
      opt("groups.layout.grid.row")
    ], (layout, row) => {
      switch (layout) {
      case "horizontal":
        return "100%";

      case "grid":
        return ((1 / row) * 100) + "%";

      default:
        return null;
      }
    }),
  });

  const style_group_wrapper_focused = dom.make_style({
    "z-index": mutable.always("2")
  });

  const style_group = dom.make_style({
    // TODO hack to make it smoother when opening/closing windows
    "transform": mutable.always("translateZ(0)"),

    "left": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        // width / 2
        return "calc(-150px + 50%)";
      default:
        return null;
      }
    }),

    "width": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "300px";
      default:
        return null;
      }
    }),

    "height": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "100%";
      case "grid":
        // TODO this is hacky, it needs to be kept in sync with the margins
        return "calc(100% - 6px)";
      default:
        return null;
      }
    }),

    "box-shadow": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
        return "-2px 0px 5px -2px " + dom.hsl(0, 0, 50, 0.7) + "," +
               "1px 1px 1px 0px " + dom.hsl(0, 0, 50, 0.7);
      case "grid":
        // TODO code duplication
        return "0px 0px 5px -2px " + dom.hsl(0, 0, 50, 0.7) + "," +
               "1px 1px 1px 0px " + dom.hsl(0, 0, 50, 0.7);
      default:
        return null;
      }
    }),

    "border-width": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
      case "grid":
        return "1px";
      case "vertical":
        return "1px 0px 0px 0px";
      default:
        return null;
      }
    }),

    "margin": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "grid":
        return "3px";
      default:
        return null;
      }
    }),

    "border-color": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
      case "grid":
        return dom.hsl(211, 50, 65) + " " +
               dom.hsl(211, 50, 50) + " " +
               dom.hsl(211, 50, 45) + " " +
               dom.hsl(211, 50, 60);
      case "vertical":
        return dom.hsl(211, 50, 75);
      default:
        return null;
      }
    }),

    /*"border-image-source": mutable.always(dom.gradient("to right",
                                                   ["0%", "transparent"],
                                                   ["5%", dom.hsl(211, 50, 75)],
                                                   ["95%", dom.hsl(211, 50, 75)],
                                                   ["100%", "transparent"])),
    "border-image-slice": mutable.always("100% 0%"),*/

    //"border-color": mutable.always(dom.hsl(211, 50, 75)),

    "top": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "vertical":
        return "-1px";
      default:
        return null;
      }
    }),

    "padding-top": mutable.always("3px"),
    "padding-left": mutable.always("1px"),
    "padding-right": mutable.always("1px"),

    "background-color": mutable.always(dom.hsl(0, 0, 100)),
  });

  const style_group_focused = dom.make_style({
    "box-shadow": mutable.always("0px 0px 4px 1px " + dom.hsl(211, 80, 50)),
  });

  const style_group_header = dom.make_style({
    // TODO is this correct ?
    "height": mutable.always("16px"),
    //"padding-top": mutable.always("1px"), // TODO this needs to be animated
    "padding-left": mutable.always("4px")
  });

  const style_group_text = dom.make_style({
    "font-size": mutable.always("11px")
  });

  const style_group_tabs = dom.make_style({
    // This is needed so that drag-and-drop works correctly (i.e. "height")
    "box-sizing": mutable.always("content-box"),

    "height": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
      case "grid":
        // TODO this is hacky, it needs to be kept in sync with style_group_header and padding-bottom
        return "calc(100% - 16px - 3px)";
      default:
        return null;
      }
    }),

    // TODO hack which causes Chrome to not repaint when scrolling
    "transform": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
      case "grid":
        return "translateZ(0)";
      default:
        return null;
      }
    }),

    //"transition": mutable.always("height 1000ms ease-in-out"),
    "overflow-y": mutable.map(opt("groups.layout"), (x) => {
      switch (x) {
      case "horizontal":
      case "grid":
        return "auto";
      default:
        return null;
      }
    }),

    // TODO test if using "padding-bottom" rather than "margin-bottom" messes up tab drag-and-drop
    "padding-bottom": mutable.always("3px"),
  });

  const group_header = (group) =>
    dom.parent((e) => [
      dom.add_style(e, dom.row),
      dom.add_style(e, style_group_header),

      dom.animate(e, animation_group_header, {
        insert: "start-at",
        remove: "end-at"
      }),

      // TODO is this correct ?
      dom.on_mouse_hover(e, (hover) => {
        // TODO is this correct ?
        if (hover && !hover.subtree) {
          drag_onto_group(group);
        }
      }),

      dom.children(e, [
        dom.text((e) => [
          dom.add_style(e, dom.stretch),
          dom.add_style(e, style_group_text),

          dom.set_value(e, record.get(group, "name"))
        ])
      ])
    ]);

  const group_tabs = (group) =>
    dom.parent((e) => [
      dom.add_style(e, dom.stretch),
      dom.add_style(e, style_group_tabs),

      dom.animate(e, animation_group_tabs, {
        insert: "start-at",
        remove: "end-at"
      }),

      dom.style(e, {
        "height": mutable.latest([
          opt("groups.layout"),
          record.get(group, "height")
        ], (layout, height) => {
          switch (layout) {
          case "vertical":
            return height;
          default:
            return null;
          }
        })
      }),

      dom.on_mouse_hover(e, (hover) => {
        if (hover && !hover.subtree) {
          drag_onto_group(group);
        }
      }),

      dom.stream(e, stream.map(record.get(group, "tabs"), (x) =>
                      ui_tab(group, x)))
    ]);

  const is_horizontal = mutable.map(opt("groups.layout"), (x) =>
                          (x === "horizontal"));

  const group = (group) => {
    const is_focused = mutable.and([
      record.get(group, "selected"),
      is_horizontal
    ]);

    return dom.parent((e) => [
      dom.add_style(e, style_group_wrapper),

      dom.toggle_style(e, style_group_wrapper_focused, is_focused),

      dom.toggle_visible(e, record.get(group, "visible")),

      dom.animate(e, animation_group_wrapper, {
        insert: "start-at",
        remove: "end-at"
      }),

      dom.children(e, [
        dom.parent((e) => [
          // TODO is this needed ?
          dom.add_style(e, dom.stretch),
          dom.add_style(e, style_group),
          dom.add_style(e, style_texture),

          dom.toggle_style(e, style_group_focused, is_focused),

          dom.on_focus(e, (focused) => {
            // TODO a little hacky, should be a part of logic
            mutable.set(record.get(group, "selected"), focused);
          }),

          dom.animate(e, animation_group, {
            insert: "start-at",
            remove: "end-at"
          }),

          dom.children(e, [
            group_header(group),
            group_tabs(group)
          ])
        ])
      ])
    ]);
  };


  return async.done({ group });
});

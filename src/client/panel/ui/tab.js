import * as dom from "../../../util/dom";
import * as list from "../../../util/list";
import * as record from "../../../util/record";
import * as stream from "../../../util/stream";
import * as async from "../../../util/async";
import * as mutable from "../../../util/mutable";
import * as console from "../../../util/console";
import { url_bar } from "./url-bar";
import { init as init_options } from "../../sync/options";
import { init as init_dragging } from "../logic/dragging";
import { init as init_groups } from "../logic/groups";


export const init = async.all([init_options,
                               init_dragging,
                               init_groups],
                              ({ get: opt },
                               { dragging_animate, dragging_started,
                                 dragging_dimensions, drag_start, drag_end,
                                 drag_onto_tab },
                               { close_tabs, click_tab, shift_select_tab,
                                 ctrl_select_tab }) => {

  let dragging_offset_x = null;
  let dragging_offset_y = null;
  let dragging_should_x = true;

  const tab_height = 20;

  // TODO move this into another module
  // TODO better implementation of this ?
  const hypot = (x, y) =>
    Math["sqrt"](x * x + y * y);


  // TODO this is a tiny bit hacky
  dom.make_stylesheet("html, body", {
    "cursor": mutable.map(dragging_started, (x) =>
                (x !== null ? "grabbing" : null))
  });


  const animation_tab = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      /*"transform": {
        "rotationX": "-90deg", // 120deg
        "rotationY": "5deg", // 20deg
        //"rotationZ": "-1deg", // -1deg
      },*/

      "border-top-width": mutable.always("0px"),
      "border-bottom-width": mutable.always("0px"),
      "padding-top": mutable.always("0px"),
      "padding-bottom": mutable.always("0px"),
      "height": mutable.always("0px"),
      "opacity": mutable.always("0"),

      // This needs to match the "margin-left" in "group.js"
      "margin-left": mutable.always("12px"),
    }
  });

  const animation_tab_favicon = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "height": mutable.always("0px")
    }
  });

  const animation_tab_text = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "transform": mutable.always("rotateX(-90deg)"),
    }
  });

  const animation_tab_close = dom.make_animation({
    easing: mutable.always("ease-in-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 500 : null)),
    style: {
      "height": mutable.always("0px"),
      "border-top-width": mutable.always("0px"),
      "border-bottom-width": mutable.always("0px"),
    }
  });


  const style_dragging = dom.make_style({
    "pointer-events": mutable.always("none"),
    "opacity": mutable.always("0.98"),
    "overflow": mutable.always("visible"),

    // This causes it to be displayed on its own layer, so that we can
    // move it around without causing a relayout or repaint
    "transform": mutable.always("translate3d(0px, 0px, 0px)"),
  });


  const repeating = dom.repeating_gradient("-45deg",
                                           ["0px",  "transparent"],
                                           ["4px",  "transparent"],
                                           ["6px",  dom.hsl(0, 0, 100, 0.05)],
                                           ["10px", dom.hsl(0, 0, 100, 0.05)]);

  const style_menu_item = dom.make_style({
    "cursor": mutable.map(dragging_started, (x) =>
                (x === null ? "pointer" : null)),

    "border-width": mutable.always("1px"),

    "transition": mutable.latest([
      opt("theme.animation"),
      dragging_animate
    ], (animation, dragging_animate) =>
      (animation
        ? (dragging_animate
            // TODO minor code duplication
            ? "background-color 100ms ease-in-out, transform 100ms ease-out"
            : "background-color 100ms ease-in-out")
        : null)),
  });

  const style_menu_item_shadow = dom.make_style({
    "box-shadow": mutable.always("1px 1px  1px " + dom.hsl(0, 0,   0, 0.25) + "," +
                       "inset 0px 0px  3px " + dom.hsl(0, 0, 100, 1   ) + "," +
                       "inset 0px 0px 10px " + dom.hsl(0, 0, 100, 0.25)),
  });

  const style_menu_item_hover = dom.make_style({
    // TODO a bit hacky
    "transition-duration": mutable.always("0ms"),

    "background-image": mutable.always(dom.gradient("to bottom",
                                                ["0%",   dom.hsl(0, 0, 100, 0.2)],
                                                ["49%",  "transparent"          ],
                                                ["50%",  dom.hsl(0, 0,   0, 0.1)],
                                                ["80%",  dom.hsl(0, 0, 100, 0.1)],
                                                ["100%", dom.hsl(0, 0, 100, 0.2)]) + "," +
                                   repeating),
    "color": mutable.always(dom.hsl(211, 100, 99, 0.95)),
    "background-color": mutable.always(dom.hsl(211, 100, 65)),

    "border-color": mutable.always(dom.hsl(211, 38, 62) + " " +
                               dom.hsl(211, 38, 57) + " " +
                               dom.hsl(211, 38, 52) + " " +
                               dom.hsl(211, 38, 57)),

    "text-shadow": mutable.always("1px 0px 1px " + dom.hsl(0, 0, 0, 0.2) + "," +
                              "0px 0px 1px " + dom.hsl(0, 0, 0, 0.1) + "," +
                              "0px 1px 1px " + dom.hsl(0, 0, 0, 0.2)) // TODO why is it duplicated like this ?
  });

  const style_menu_item_hold = dom.make_style({
    "background-position": mutable.always("0px 1px"),
    "background-image": mutable.always(dom.gradient("to bottom",
                                                ["0%",   dom.hsl(0, 0, 100, 0.2)  ],
                                                ["49%",  "transparent"            ],
                                                ["50%",  dom.hsl(0, 0,   0, 0.075)],
                                                ["80%",  dom.hsl(0, 0, 100, 0.1)  ],
                                                ["100%", dom.hsl(0, 0, 100, 0.2)  ]) + "," +
                                   repeating),
    "box-shadow": mutable.always("1px 1px 1px "  + dom.hsl(0, 0,   0, 0.1) + "," +
                       "inset 0px 0px 3px "  + dom.hsl(0, 0, 100, 0.9) + "," +
                       "inset 0px 0px 10px " + dom.hsl(0, 0, 100, 0.225)),
  });


  const style_tab = dom.make_style({
    "width": mutable.always("100%"),
    "height": mutable.always(tab_height + "px"),
    "padding": mutable.always("1px"),
    "border-radius": mutable.always("5px"),
  });

  const style_tab_hover = dom.make_style({
    "font-weight": mutable.always("bold"),
  });

  const style_tab_hold = dom.make_style({
    "padding-top": mutable.always("2px"),
    "padding-bottom": mutable.always("0px"),
  });

  const style_tab_unloaded = dom.make_style({
    "color": mutable.always(dom.hsl(0, 0, 30)),
    "opacity": mutable.always("0.75"),
  });

  const style_tab_unloaded_hover = dom.make_style({
    "background-color": mutable.always(dom.hsl(0, 0, 0, 0.4)),

    "border-color": mutable.always(dom.hsl(0, 0, 62) + " " +
                               dom.hsl(0, 0, 57) + " " +
                               dom.hsl(0, 0, 52) + " " +
                               dom.hsl(0, 0, 57)),

    "color": mutable.always(dom.hsl(0, 0, 99, 0.95)), // TODO minor code duplication with `style_menu_item_hover`
    "opacity": mutable.always("1")
  });

  const style_tab_focused = dom.make_style({
    "background-color": mutable.always(dom.hsl(30, 100, 94)),

    "border-color": mutable.always(dom.hsl(30, 70, 62) + " " +
                               dom.hsl(30, 70, 57) + " " +
                               dom.hsl(30, 70, 52) + " " +
                               dom.hsl(30, 70, 57)),

    // TODO a bit hacky
    "transition-duration": mutable.map(dragging_animate, (dragging_animate) =>
                             (dragging_animate
                               ? null
                               : "0ms")),
  });

  const style_tab_focused_hover = dom.make_style({
    "background-color": mutable.always(dom.hsl(30, 85, 57)),
  });

  const style_tab_selected = dom.make_style({
    "background-color": mutable.always(dom.hsl(100, 78, 80)),

    "border-color": mutable.always(dom.hsl(100, 50, 55) + " " +
                               dom.hsl(100, 50, 50) + " " +
                               dom.hsl(100, 50, 45) + " " +
                               dom.hsl(100, 50, 50)),

    /*"box-shadow": mutable.always("inset 0px 1px 0px 0px " + dom.hsl(100, 70, 75) + "," +
                             "inset 0px -1px 0px 0px " + dom.hsl(100, 70, 70) + "," +
                             "inset 0px 0px 0px 1px " + dom.hsl(100, 70, 65) + "," +
                             "")*/
    /*
    background-image: -webkit-gradient(linear, 0% 0%, 0% 100%, from(transparent), color-stop(0.1, rgba(0, 0, 0, 0.02)), color-stop(0.8, transparent), color-stop(0.9, rgba(0, 0, 0, 0.03)), to(rgba(0, 0, 0, 0.04)))

    background-color: rgba(114, 255, 0, 0.3)

    border-color: hsl(120, 100%, 20%)
    */
  });

  const style_tab_selected_hover = dom.make_style({
    "background-color": mutable.always(dom.hsl(100, 80, 45)),
  });

  const style_icon = dom.make_style({
    "height": mutable.always("16px"),
    "border-radius": mutable.always("4px"),
    "box-shadow": mutable.always("0px 0px 15px " + dom.hsl(0, 0, 100, 0.9)),
    "background-color": mutable.always(dom.hsl(0, 0, 100, 0.35))
  });

  const style_favicon = dom.make_style({
    "width": mutable.always("16px"),
    "margin-left": mutable.always("2px"),
    "margin-right": mutable.always("1px")
  });

  const style_favicon_unloaded = dom.make_style({
    "filter": mutable.always("grayscale(100%)")
  });

  const style_text = dom.make_style({
    "padding-left": mutable.always("3px"),
    "padding-right": mutable.always("1px")
  });

  const style_close = dom.make_style({
    "width": mutable.always("18px"),
    "border-width": mutable.always("1px"),
    "padding-left": mutable.always("1px"),
    "padding-right": mutable.always("1px")
  });

  const style_close_hover = dom.make_style({
    "background-color": mutable.always(dom.hsl(0, 0, 100, 0.75)),
    "border-color": mutable.always(dom.hsl(0, 0, 90, 0.75) + " " +
                               dom.hsl(0, 0, 85, 0.75) + " " +
                               dom.hsl(0, 0, 85, 0.75) + " " +
                               dom.hsl(0, 0, 90, 0.75))
  });

  const style_close_hold = dom.make_style({
    "padding-top": mutable.always("1px"),
    "background-color": mutable.always(dom.hsl(0, 0,  98, 0.75)),
    "border-color": mutable.always(dom.hsl(0, 0,  70, 0.75) + " " +
                               dom.hsl(0, 0, 100, 0.75) + " " +
                               dom.hsl(0, 0, 100, 0.80) + " " +
                               dom.hsl(0, 0,  80, 0.75))
  });


  // TODO remove this animation
  const animation_dragging = dom.make_animation({
    easing: mutable.always("ease-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 300 : null)),
    style: {
      "margin-top": mutable.always("0px")
    }
  });

  // TODO remove this animation
  const animation_dragging_hidden = dom.make_animation({
    easing: mutable.always("ease-out"),
    duration: mutable.map(opt("theme.animation"), (x) =>
                (x ? 300 : null)),
    style: {
      "margin-top": mutable.always("0px"),
      "opacity": mutable.always("1")
    }
  });

  const style_tab_dragging = dom.make_style({
    "margin-top": mutable.always("-" + (tab_height - 2) + "px")
  });

  const style_tab_dragging_hidden = dom.make_style({
    "margin-top": mutable.always("-" + tab_height + "px"),
    "opacity": mutable.always("0")
  });


  const favicon = (tab) =>
    dom.image((e) => [
      // TODO use setTimeout to fix a bug with Chrome ?
      dom.set_url(e, record.get(tab, "favicon")),

      dom.add_style(e, style_icon),
      dom.add_style(e, style_favicon),
      dom.toggle_style(e, style_favicon_unloaded, record.get(tab, "unloaded")),

      dom.animate(e, animation_tab_favicon, {
        insert: "start-at",
        remove: "end-at"
      })
    ]);

  const text = (tab) =>
    dom.text((e) => [
      dom.add_style(e, dom.stretch),
      dom.add_style(e, style_text),

      dom.animate(e, animation_tab_text, {
        insert: "start-at",
        remove: "end-at"
      }),

      // TODO what about dragging ?
      dom.set_tooltip(e, record.get(tab, "title")),

      dom.set_value(e, mutable.latest([
        record.get(tab, "title"),
        record.get(tab, "unloaded")
      ], (title, unloaded) => {
        if (unloaded) {
          if (title === null) {
            return "➔";
          } else {
            return "➔ " + title;
          }

        } else {
          return title;
        }
      }))
    ]);

  const close = (tab, visible, hovering) =>
    dom.image((e) => {
      const holding = mutable.make(null);

      return [
        dom.set_url(e, mutable.always("data/images/button-close.png")),

        dom.add_style(e, style_icon),
        dom.add_style(e, style_close),

        dom.toggle_visible(e, visible),

        dom.toggle_style(e, style_close_hover,
          mutable.map(hovering, (x) =>
            x !== null)),

        dom.toggle_style(e, style_close_hold, mutable.and([
          hovering,
          holding
        ])),

        dom.on_mouse_hover(e, (hover) => {
          mutable.set(hovering, hover);
        }),

        dom.on_mouse_hold(e, (hold) => {
          mutable.set(holding, hold);
        }),

        dom.animate(e, animation_tab_close, {
          insert: "start-at",
          remove: "end-at"
        }),

        dom.on_left_click(e, ({ shift, ctrl, alt }) => {
          if (!shift && !ctrl && !alt) {
            close_tabs([tab]);
          }
        }),
      ];
    });


  const dragging =
    dom.parent((e) => [
      dom.add_style(e, dom.floating),
      dom.add_style(e, style_dragging),

      dom.toggle_visible(e, mutable.map(dragging_started, (x) =>
                              x !== null)),

      dom.children(e, mutable.map_null(dragging_started, ({ selected }) =>
        list.map(selected, (tab, index) =>
          ui_dragging(tab, index)))),

      dom.style(e, {
        "transform": mutable.map_null(dragging_dimensions, ({ x, y }) =>
                       "translate3d(" + x + "px, " +
                                        y + "px, 0px)"),

        "width": mutable.map_null(dragging_started, ({ width }) =>
                   width + "px")
      }),
    ]);

  // TODO hacky
  dom.push_root(dragging);

  const group_type = opt("group.sort.type");

  const tab_drag_start_if = (start_x, start_y, { x, y, alt, ctrl, shift }) =>
    // TODO should also support dragging when the type is "tag"
    mutable.get(group_type) === "window" &&
    !alt && !ctrl && !shift &&
    hypot(start_x - x, start_y - y) > 5;

  // TODO this should be a part of logic and stuff
  const tab_drag_start = ({ group, tab, e, x, y }) => {
    async.run(dom.get_position(e), (tab_box) => {
      const tabs = record.get(group, "tabs");

      const selected = list.make();

      list.each(stream.current(tabs), (x) => {
        if (mutable.get(record.get(x, "selected")) &&
            // TODO is this correct ?
            mutable.get(record.get(x, "visible"))) {
          list.push(selected, x);
        }
      });

      if (list.size(selected) === 0) {
        list.push(selected, tab);
      }

      list.each(selected, (tab) => {
        mutable.set(record.get(tab, "visible"), false);
      });

      // TODO hacky
      const height = (list.size(selected) === 1
                       ? tab_height
                       : (tab_height +
                          (Math["min"](list.size(selected), 4) * 3)));

      dragging_should_x = (mutable.get(opt("groups.layout")) !== "vertical");
      dragging_offset_x = (x - tab_box.left);
      dragging_offset_y = (tab_height / 2) + 1;

      mutable.set(dragging_dimensions, {
        x: (x - dragging_offset_x),
        y: (y - dragging_offset_y)
      });

      mutable.set(dragging_started, {
        selected: selected,
        width: Math["round"](tab_box.width)
      });

      drag_start({ group, tab, height });
    });
  };

  const tab_drag_move = ({ x, y }) => {
    // TODO is it faster to have two Refs, rather than using an object ?
    mutable.set(dragging_dimensions, {
      x: (dragging_should_x
           ? (x - dragging_offset_x)
           // TODO a little bit hacky
           : mutable.get(dragging_dimensions).x),
      y: (y - dragging_offset_y)
    });
  };

  const tab_drag_end = () => {
    const { selected } = mutable.get(dragging_started);

    list.each(selected, (tab) => {
      mutable.set(record.get(tab, "visible"), true);

      /*if (i !== 0) {
        mutable.set(record.get(tab, "animate"), {
          from: style_hidden,
          to: style_visible,
          duration: 500,
          easing: ease_out
        });
      }*/
    });

    drag_end(selected);

    mutable.set(dragging_started, null);
    mutable.set(dragging_dimensions, null);

    dragging_should_x = true;
    dragging_offset_x = null;
    dragging_offset_y = null;
  };


  const is_window = mutable.map(opt("group.sort.type"), (x) =>
                      (x === "window"));

  const tab_children = (e, tab, is_hovering, hovering_close) => {
    const visible = mutable.latest([
      opt("tabs.close.display"),
      is_hovering
    ], (display, hover) =>
      (display === "every") ||
      (display === "hover" && hover));

    const ui_favicon = favicon(tab);
    const ui_text    = text(tab);
    const ui_close   = close(tab, visible, hovering_close);

    return dom.children(e, mutable.map(opt("tabs.close.location"), (x) => {
      if (x === "left") {
        return [ui_close, ui_text, ui_favicon];

      } else if (x === "right") {
        return [ui_favicon, ui_text, ui_close];
      }
    }));
  };

  const tab_template = (e, tab, is_hovering, f) => {
    const is_focused = mutable.and([
      record.get(tab, "focused"),
      // TODO is this correct ?
      is_window,
      // "selected" has precedence over "focused"
      mutable.not(record.get(tab, "selected"))
    ]);

    const hovering_close = mutable.make(null);

    const output = f(is_focused, hovering_close);

    list.push(output, dom.add_style(e, dom.row));
    list.push(output, dom.add_style(e, style_tab));
    list.push(output, dom.add_style(e, style_menu_item));

    list.push(output, dom.toggle_style(e, style_tab_hover, is_hovering));
    list.push(output, dom.toggle_style(e, style_menu_item_hover, is_hovering));

    list.push(output,
      dom.toggle_style(e, style_tab_selected,
        record.get(tab, "selected")));

    // TODO test this
    list.push(output,
      dom.toggle_style(e, style_tab_selected_hover, mutable.and([
        record.get(tab, "selected"),
        is_hovering
      ])));

    list.push(output, dom.toggle_style(e, style_tab_focused, is_focused));

    list.push(output,
      dom.toggle_style(e, style_tab_focused_hover, mutable.and([
        is_focused,
        is_hovering
      ])));

    // TODO test these
    list.push(output,
      dom.toggle_style(e, style_tab_unloaded,
        record.get(tab, "unloaded")));

    list.push(output,
      dom.toggle_style(e, style_tab_unloaded_hover, mutable.and([
        record.get(tab, "unloaded"),
        is_hovering
      ])));

    list.push(output, tab_children(e, tab, is_hovering, hovering_close));

    return output;
  };


  // TODO code duplication with `tab`
  const ui_dragging = (tab, index) =>
    dom.parent((e) => {
      const is_hovering = mutable.always(index === 0);

      // TODO code duplication with `tab`
      return tab_template(e, tab, is_hovering, () => [
        dom.add_style(e, style_menu_item_shadow),

        dom.toggle_style(e, style_tab_dragging,
          mutable.always(index >= 1 && index < 5)),

        dom.toggle_style(e, style_tab_dragging_hidden,
          mutable.always(index >= 5)),

        // TODO a tiny bit hacky
        (index === 0
          ? dom.noop()
          : dom.animate(e, (index < 5
                             ? animation_dragging
                             : animation_dragging_hidden), {
              initial: "start-at"
            })),

        // TODO a bit hacky
        dom.style(e, {
          "z-index": mutable.always((-index) + "")
        })
      ]);
    });


  const tab = (group, tab) =>
    dom.parent((e) => {
      const hovering = mutable.make(null);
      const holding  = mutable.make(null);

      const is_hovering = mutable.and([
        mutable.not(dragging_started),
        hovering
      ]);

      return tab_template(e, tab, is_hovering, (is_focused, hovering_close) => {
        const is_holding = mutable.and([
          is_hovering,
          holding,
          // TODO a little bit hacky
          mutable.not(hovering_close)
        ]);

        return [
          // TODO test this
          // TODO a little bit hacky
          dom.toggle_style(e, style_menu_item_shadow, mutable.or([
            is_hovering,
            record.get(tab, "selected")
          ])),

          dom.toggle_style(e, style_tab_hold, is_holding),
          dom.toggle_style(e, style_menu_item_hold, is_holding),

          dom.animate(e, animation_tab, {
            insert: "start-at",
            remove: "end-at"
          }),

          dom.toggle_visible(e, record.get(tab, "visible")),

          dom.scroll_to(e, {
            // TODO maybe add `tab.get("visible")` to the definition of `is_focused` ?
            initial: mutable.first(is_focused),
            // TODO make this work with vertical mode
            //insert: tab.get("visible")
          }),

          mutable.listen(mutable.latest([
            hovering,
            dragging_started,
            record.get(tab, "url")
          ], (hover, dragging, url) => {
            if (hover && !dragging && url) {
              return url;
            } else {
              return null;
            }
          }), (x) => {
            mutable.set(url_bar, x);
          }),

          dom.on_mouse_hover(e, (hover) => {
            mutable.set(hovering, hover);
          }),

          dom.on_mouse_hold(e, (hold) => {
            mutable.set(holding, hold);
          }),

          dom.on_left_click(e, ({ shift, ctrl, alt }) => {
            // TODO a little hacky
            if (!mutable.get(hovering_close)) {
              if (!shift && !ctrl && !alt) {
                click_tab(group, tab);

              } else if (shift && !ctrl && !alt) {
                shift_select_tab(group, tab);

              } else if (!shift && ctrl && !alt) {
                ctrl_select_tab(group, tab);
              }
            }
          }),

          dom.on_middle_click(e, ({ shift, ctrl, alt }) => {
            if (!shift && !ctrl && !alt) {
              close_tabs([tab]);
            }
          }),

          dom.on_right_click(e, (e) => {
            console.log("right click", e);
          }),

          dom.on_mouse_hover(e, (hover) => {
            if (hover) {
              drag_onto_tab(group, tab);
            }
          }),

          dom.style(e, {
            "position": mutable.map_null(record.get(tab, "top"), (x) =>
                          "absolute"),

            "transform": mutable.map_null(record.get(tab, "top"), (x) =>
                           "translate3d(0px, " + x + ", 0px)")
          }),

          dom.draggable(e, {
            start_if: tab_drag_start_if,
            start: ({ x, y }) => {
              tab_drag_start({ group, tab, e, x, y });
            },
            move: tab_drag_move,
            end: tab_drag_end
          })
        ];
      });
    });


  return async.done({ tab });
});

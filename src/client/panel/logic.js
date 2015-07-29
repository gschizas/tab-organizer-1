import { uuid_port_tab } from "../../common/uuid";
import { ports } from "../../chrome/client";
import { async } from "../../util/async";
import { Ref } from "../../util/mutable/ref";
import { Set } from "../../util/mutable/set";
import { Record } from "../../util/mutable/record";
import { List, SortedList } from "../../util/mutable/list";
import { each, map, to_array, indexed } from "../../util/iterator";
import { assert, fail } from "../../util/assert";

import * as sort_by_window from "./logic/sort-by-window";

import { current_time, round_to_hour, difference } from "../../util/time";
import { group_list as ui_group_list } from "./ui/group-list";
import * as dom from "../dom";


/*const get_groups = new Ref((tab) => {
  const title = tab.get("title").value;
  return [title ? title[0] : ""];
});*/

/*const sort_tab = new Ref((tab1, tab2) => {
  const title1 = tab1.get("title").value;
  const title2 = tab2.get("title").value;

  if (title1 === title2) {
    return tab1.get("time").get("created") -
           tab2.get("time").get("created");

  } else if (title1 < title2) {
    return -1;
  } else {
    return 1;
  }
});*/


export const windows    = new List();
export const window_ids = new Record();
export const tab_ids    = new Record();

const make_window = ({ "id": id,
                       "name": name }) =>
  new Record({
    "id": id,
    "name": new Ref(name),
    "tabs": new List(),
    // TODO a little hacky
    "first-selected-tab": null
  });

const make_tab = ({ "id": id,
                    "url": url,
                    "title": title,
                    "favicon": favicon,
                    "pinned": pinned,
                    "focused": focused,
                    "unloaded": unloaded },
                  window) =>
  new Record({
    "id": id,
    "window": window,
    // TODO should this be a Ref instead ?
    "index": null,
    // TODO make this into a Record or Ref ?
    //"time": info.get("time"),
    //"groups": new Set(),

    "url": new Ref(url),
    "title": new Ref(title || url || ""),
    "favicon": new Ref(favicon),
    "pinned": new Ref(pinned),

    "selected": new Ref(false),
    "focused": new Ref(focused),
    "unloaded": new Ref(unloaded),

    "visible": new Ref(true),
    "top": new Ref(null)
  });

/*
// TODO remove remaining tabs as well ?
// TODO what about "selected" ?
const remove_group = (group) => {
  group_ids.remove(group.get("id"));

  group_list.remove(group);
};*/

/*const remove_tab = (tab) => {
  const groups = tab.get("groups");

  each(groups, (group) => {
    const tabs = group.get("tabs");

    tabs.remove(tab);

    if (tabs.size === 0) {
      remove_group(group);
    }
  });

  groups.clear();
};*/


const drag_info = new Ref(null);

export const drag_onto_tab = (group, tab) => {
  const info = drag_info.get();

  if (info) {
    drag_info.set({
      group: group,
      tab: tab,
      height: info.height,

      // TODO a little hacky
      direction: (() => {
        if (info.tab === tab) {
          return (info.direction === "up"
                   ? "down"
                   : "up");

        } else if (info.group === group) {
          // TODO is there a better way than using indexes ?
          const old_index = info.tab.get("index");
          const new_index = tab.get("index");

          if (old_index < new_index) {
            return "down";

          } else {
            return "up";
          }

        } else {
          return "up";
        }
      })()
    });

    if (info.group !== group) {
      update_indexes(info.group.get("tabs"));
    }

    update_indexes(group.get("tabs"));
  }
};

export const drag_onto_group = (group) => {
  const info = drag_info.get();

  // TODO this isn't quite right, but it works most of the time
  if (info !== null && info.group !== group) {
    // TODO is this guaranteed to be correct ?
    assert(group.get("tabs").size > 0);

    drag_info.set({
      group: group,
      tab: group.get("tabs").get(-1),
      height: info.height,
      direction: "down"
    });

    // TODO does this need to update `group.get("tabs")` ?
    update_indexes(info.group.get("tabs"));
  }
};

export const drag_start = ({ group, tab, height }) => {
  drag_info.set({
    group: group,
    tab: tab,
    height: height,
    direction: "up"
  });

  update_indexes(group.get("tabs"));
};

export const drag_end = (selected) => {
  const info = drag_info.get();

  drag_info.set(null);

  each(selected, (x) => {
    // TODO hacky
    const tabs = x.get("window").get("tabs");

    tabs.remove(x.get("index"));

    // TODO hacky
    x.update("window", info.group);

    // TODO inefficient
    update_indexes(tabs);
  });

  const tabs = info.group.get("tabs");
  const index1 = info.tab.get("index");
  // TODO a bit hacky
  const index2 = (info.direction === "down" && tabs.has(index1)
                   ? index1 + 1
                   : index1);

  each(indexed(selected), ([i, x]) => {
    tabs.insert(index2 + i, x);
  });

  update_indexes(tabs);
};


const update_names = (a) => {
  each(indexed(a), ([i, x]) => {
    x.get("name").modify((name) => {
      if (name === null) {
        return "" + (i + 1);
      } else {
        return name;
      }
    });
  });
};

// TODO this can be more efficient if it is given the starting index
const update_indexes = (a) => {
  const info = drag_info.get();

  let top = 0;

  each(indexed(a), ([i, x]) => {
    x.update("index", i);

    // TODO a bit hacky
    if (info !== null && info.tab === x && info.direction === "up") {
      top += info.height;
    }

    if (x.get("visible").get()) {
      x.get("top").set(top + "px");
      top += 20; // TODO gross
    }

    // TODO a bit hacky
    if (info !== null && info.tab === x && info.direction === "down") {
      top += info.height;
    }
  });
};

// TODO this is still broken
export const move_tabs = (selected, { group, tab, direction }) => {
  let to_index = tab.get("index");

  each(selected, (tab) => {
    const window = tab.get("window");
    const tabs = window.get("tabs");
    const index = tab.get("index");

    // TODO hacky
    if (window === group && index < to_index) {
      --to_index;
    }

    // TODO hacky
    tab.update("window", group);

    assert(tabs.get(index) === tab);

    tabs.remove(index);

    // TODO inefficient ?
    update_indexes(tabs);
  });

  const tabs = group.get("tabs");

  const index = (direction === "down"
                  ? to_index + 1
                  : to_index);

  each(indexed(selected), ([i, tab]) => {
    tabs.insert(to_index + i, tab);
  });

  update_indexes(tabs);

  port.send({
    "type": "move-tabs",
    // TODO hacky
    "window": group.get("id"),
    "tabs": to_array(map(selected, (tab) => tab.get("id"))),
    "index": index
  });
};


dom.main(ui_group_list(sort_by_window.groups));


const port = ports.connect(uuid_port_tab);

const types = {
  "init": ({ "windows": _windows }) => {

    each(_windows, (info) => {
      const window = make_window(info);

      const tabs = window.get("tabs");

      each(info["tabs"], (info) => {
        const tab = make_tab(info, window);

        tab_ids.insert(tab.get("id"), tab);

        tabs.push(tab);
      });

      // TODO because we're pushing, this can be made O(1) rather than O(n)
      update_indexes(tabs);

      window_ids.insert(window.get("id"), window);

      windows.push(window);
    });

    update_names(windows);

    //sort_by_window.init(windows);
  },

  "tab-open": ({ "tab": info,
                 "window-id": window_id,
                 "tab-index": index }) => {

    const window = window_ids.get(window_id);
    const tabs = window.get("tabs");

    const tab = make_tab(info, window);

    tab_ids.insert(tab.get("id"), tab);

    tabs.insert(index, tab);

    update_indexes(tabs);
  },

  // TODO update the timestamp as well
  "tab-focus": ({ "tab-id": id }) => {
    tab_ids.get(id).get("focused").set(true);
  },

  "tab-unfocus": ({ "tab-id": id }) => {
    tab_ids.get(id).get("focused").set(false);
  },

  "tab-update": ({ "tab-id": id,
                   "tab": { "url": url,
                            "title": title,
                            "favicon": favicon,
                            "pinned": pinned } }) => {

    const tab = tab_ids.get(id);

    tab.get("url").set(url);
    // TODO code duplication
    tab.get("title").set(title || url || "");
    tab.get("favicon").set(favicon);
    tab.get("pinned").set(pinned);
  },

  "tab-move": ({ "window-old-id": old_window_id,
                 "window-new-id": new_window_id,
                 "tab-old-index": old_index,
                 "tab-new-index": new_index,
                 "tab-id": tab_id }) => {

    const old_window = window_ids.get(old_window_id);
    const new_window = window_ids.get(new_window_id);
    const old_tabs = old_window.get("tabs");
    const new_tabs = new_window.get("tabs");
    const tab = tab_ids.get(tab_id);

    assert(old_tabs.get(old_index) === tab);

    old_tabs.remove(old_index);
    new_tabs.insert(new_index, tab);

    if (old_tabs !== new_tabs) {
      update_indexes(old_tabs);
    }

    update_indexes(new_tabs);
  },

  "tab-close": ({ "window-id": window_id,
                  "tab-id": tab_id,
                  "tab-index": index }) => {

    const window = window_ids.get(window_id);
    const tab = tab_ids.get(tab_id);
    const tabs = window.get("tabs");

    tab_ids.remove(tab.get("id"));

    assert(tabs.get(index) === tab);

    tabs.remove(index);

    update_indexes(tabs);
  },

  "window-open": ({ "window": info,
                    "window-index": index }) => {

    const window = make_window(info);

    assert(info.get("tabs").size === 0);

    window_ids.insert(window.get("id"), window);

    windows.insert(index, window);

    // TODO this can be made more efficient
    update_names(windows);
  },

  "window-close": ({ "window-id": window_id,
                     "window-index": index }) => {

    const window = window_ids.get(window_id);

    assert(window.get("tabs").size === 0);

    window_ids.remove(window.get("id"));

    assert(windows.get(index) === window);

    windows.remove(index);

    update_names(windows);
  }
};

port.on_receive((x) => {
  const type = x["type"];
  if (types[type]) {
    types[type](x);
  } else {
    fail();
  }
});

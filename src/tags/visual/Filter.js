import React from "react";
import { types, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Input } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";

/**
 * Add a filter search for a large number of labels.
 * @example
 * <View>
 *   <Filter name="filter" toName="ner"
 *           hotkey="shift+f" minlength="0"
 *           placeholder="Filter" />
 *   <Labels name="ner" toName="text" showInline="false">
 *     <Label value="Person" />
 *     <Label value="Organization" />
 *   </Labels>
 *   <Text name="text" value="$text" />
 * </View>
 * @name Filter
 * @param {string} [placeholder="Quick Filter"]      - Placeholder text for filter
 * @param {number} [minlength=3]      - Size of the filter
 * @param {string} [style]            - CSS style of the string
 * @param {string} [hotkey]           - Hotkey to use to focus on the filter text area
 */

const TagAttrs = types.model({
  casesensetive: types.optional(types.boolean, false),

  cleanup: types.optional(types.boolean, true),

  placeholder: types.optional(types.string, "Quick Filters"),
  minlength: types.optional(types.string, "3"),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "filter",
    _value: types.maybeNull(types.string),
    name: types.identifier,
    toname: types.maybeNull(types.string),
  })
  .views(self => ({
    get annotation() {
      return getRoot(self).annotationStore.selected;
    },

    get toTag() {
      return self.annotation.names.get(self.toname);
    },
  }))
  .actions(self => ({
    applyFilter() {
      let value = self._value;
      const tch = self.toTag.tiedChildren;

      if (Number(self.minlength) > value.length) {
        tch.filter(ch => !ch.visible).forEach(ch => ch.setVisible(true));
        return;
      }

      if (!self.casesensetive) value = value.toLowerCase();

      tch.forEach(ch => {
        let chval = ch._value;
        let flag = 0;
        if (!self.casesensetive) chval = chval.toLowerCase();
        const mergedChVal = chval.replace(/\s/g, '');
        value = value.replace(/\s\s+/g, ' ');
        const chArr = value.split(" ")
        chArr.forEach( elem => {
          if (elem !== "" && mergedChVal.indexOf(elem) !== -1) {ch.setVisible(true); flag =1;}
        })
        const mergedValue = value.replace(/\s/g, '');
        if (mergedChVal.indexOf(mergedValue) !== -1) { ch.setVisible(true); flag =1; }

        if (chval.indexOf(value) !== -1) { ch.setVisible(true); flag =1; }
        if (flag === 0) ch.setVisible(false);
      });
    },

    applyFilterEv(e) {
      let { value } = e.target;
      self._value = value;

      self.applyFilter();
    },

    onHotKey() {
      if (self._ref) {
        self._ref.focus();
      }

      return false;
    },

    setInputRef(ref) {
      self._ref = ref;
    },

    selectFirstElement() {
      const selected = self.toTag.selectFirstVisible();
      if (selected && self.cleanup) {
        self._value = "";
        self.applyFilter();
      }
    },
  }));

const FilterModel = types.compose("FilterModel", Model, TagAttrs, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  if (tag.type.indexOf("labels") === -1 && tag.type.indexOf("choices") === -1) return null;

  return (
    <Input
      ref={ref => {
        item.setInputRef(ref);
      }}
      value={item._value}
      size="small"
      /* addonAfter={"clear"} */
      onChange={item.applyFilterEv}
      onPressEnter={item.selectFirstElement}
      placeholder={item.placeholder}
    />
  );
});

Registry.addTag("filter", FilterModel, HtxFilter);

export { HtxFilter, FilterModel };

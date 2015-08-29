'use strict';

import * as types from '../constants/action-types';
import Immutable from 'immutable';
import MAX_SAFE_INTEGER from 'max-safe-integer';
import FlatMapHelper from '../helpers/flat-map-helper';
import extend from 'lodash.assign';

export function AFTER_REDUCE(state, action, helpers) {
  const data = state.get('visibleData');
  const factory = ((settings, parent) => { console.log(parent.toJSON()); return {...settings, depth : settings.depth +1, visible: parent.get('expanded'), parentId: parent.get('id') }});
  const flattenedData = data.flatMap(FlatMapHelper, { settings: {parentId: null, depth: 0, visible:  true}, factory });

  //TODO: This is currently kind of a duplicate operation.
  //      we will need to do something to mimic this functionality
  //      in the flatmap or somethign along those lines
  const columns = helpers.getDataColumns(state, data);
  return state
    .set('visibleData', helpers.getSortedColumns(flattenedData, columns))
}

export function GRIDDLE_ROW_EXPANDED(state, action, helpers) {
  const griddleKey = { action }
  return state.setIn(
    ['data',
      state.get('data').findIndex(function(row) { return row.get('griddleKey') === griddleKey }),
      'expanded'
    ], true)
}

export function GRIDDLE_LOADED_DATA_AFTER(state, action, helpers) {
  const data = state.get('data');
  const columns =   helpers.getDataColumns(state, data);
  const newData = setRowProperties(data, { columns });

  return state.set('data', newData);
}

export function setRowProperties(data, properties) {
  const props = extend({
    childrenPropertyName: 'children',
    columns: []
  }, properties);

  return data.map(row => {
    let children = row.get(props.childrenPropertyName);

    if(children && children.size > 0) {
      children = setRowProperties(children, { childrenPropertyName: props.childrenPropertyName, columns: props.columns });
    }

    return row
      .sortBy((val, key) => props.columns.indexOf(key))
      .set('children', children)
      .set('expanded', false)
      .set('hasChildren', children && children.size > 0);
  });
}
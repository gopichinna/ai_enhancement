/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "csui-ext!csui/controls/app.header/burger.menu/burger.menu" ], function(module, $, _, extraMenuItems) {
  "use strict";
  const config = {
    allowedModules: [],
    ...module.config()
  };
  const __filterMenuItems = (items = []) => {
    const allowedModules = config.allowedModules;
    if (allowedModules.length > 0) {
      items = items.filter(item => allowedModules.indexOf(item.moduleName) > -1);
    }
    return items;
  };
  let burgerMenuItems = {
    getAllMenuItems: function(args) {
      let deferred = $.Deferred();
      let promises = [];
      let allMenuItems = [];
      let finalMenuItems = {
        groups: [],
        items: []
      };
      if (extraMenuItems?.length) {
        extraMenuItems.forEach(getMenuItems => {
          promises.push($.when(getMenuItems(args)).then(function(res) {
            if (res.items.length > 0) {
              res.items = __filterMenuItems(res.items);
              allMenuItems.push(res);
            } else {
              console.debug("No items are found");
            }
          }));
        });
      }
      $.whenAll.apply($, promises).then(() => {
        if (allMenuItems?.length) {
          allMenuItems.forEach(__menuItem => {
            if (__menuItem?.groups?.length) {
              let groups = __menuItem.groups;
              groups.forEach(function(group) {
                if (finalMenuItems.groups.some(group1 => group1.id === group.id)) {} else {
                  finalMenuItems.groups.push(group);
                }
              });
            }
            let items = __menuItem.items;
            items.forEach(function(item) {
              if (finalMenuItems.items.some(item1 => item1.signature === item.signature)) {} else {
                finalMenuItems.items.push(item);
              }
            });
          });
        }
        deferred.resolve(finalMenuItems);
      });
      return deferred.promise();
    }
  };
  return burgerMenuItems;
});
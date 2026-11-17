/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/table/cells/text/text.view", "csui/controls/table/cells/cell.registry", "csui/utils/base", "i18n!csui/controls/table/cells/member/impl/nls/lang" ], function(_, TextCellView, cellViewRegistry, base, lang) {
  "use strict";
  var MemberCellView = TextCellView.extend({
    className: "csui-truncate",
    needsAriaLabel: true,
    getValueText: function() {
      return MemberCellView.getValue(this.model, this.options.column);
    }
  }, {
    getValue: function(model, column) {
      var proxyUserIdKey = column?.attributes?.proxykey, proxyUserId, proxyUserNameObj, worksAs, proxyUserName;
      if (proxyUserIdKey) {
        proxyUserId = model.get(proxyUserIdKey);
        if (proxyUserId) {
          proxyUserNameObj = model.get(proxyUserIdKey + "_expand");
          proxyUserName = proxyUserNameObj.name_formatted;
          worksAs = column?.attributes?.proxyWorksAs;
        }
      }
      var columnName = column.name, userName = model.get(columnName + "_expand") || model.get(columnName) || "", agentId = model.get("agent_id" + "_expand") || model.get("agent_id"), value = !!agentId ? agentId : userName, text;
      if (_.isObject(value)) {
        if (!!agentId) {
          text = _.str.sformat(lang.agentOnBehalf, base.formatMemberName(value), base.formatMemberName(userName));
        } else {
          text = base.formatMemberName(value);
        }
      } else {
        text = model.get(columnName + "_formatted") || value.toString();
      }
      return proxyUserId && proxyUserName && worksAs ? text + worksAs + proxyUserName : text;
    },
    getModelExpand: function(options) {
      return {
        properties: [ options.column.name ]
      };
    }
  });
  cellViewRegistry.registerByDataType(14, MemberCellView);
  cellViewRegistry.registerByDataType(19, MemberCellView);
  cellViewRegistry.registerByColumnKey("owner_id", MemberCellView);
  cellViewRegistry.registerByColumnKey("user_id", MemberCellView);
  cellViewRegistry.registerByColumnKey("reserved_user_id", MemberCellView);
  return MemberCellView;
});
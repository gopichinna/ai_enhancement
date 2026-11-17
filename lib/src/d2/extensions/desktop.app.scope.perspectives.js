/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n!d2/server.adaptors/models/impl/nls/lang", "d2/utils/widget.constants", "d2/utils/widgets.utils" ], function(_, lang, widgetConstants, widgetUtils) {
  "use strict";
  var checkWidgetExists = function(errMissingWidgetConfig, widgetConfig, options) {
    options = options || {};
    options.errMissingWidgetConfig = errMissingWidgetConfig;
    return widgetUtils.performWidgetExistenceValidation(widgetConfig, options);
  }, workflowWidgetsValidator = function(errMissingWidgetConfig, widgetConfig, options) {
    options = options || {};
    options.errMissingWidgetConfig = errMissingWidgetConfig;
    var vr = widgetUtils.performWidgetExistenceValidation(widgetConfig, options);
    if (vr.status) {
      vr = widgetUtils.performCustomValidationForWidget(widgetConfig, options);
    }
    return vr;
  };
  return [ {
    applicationScope: widgetConstants.WIDGET_SCOPE.RECENTLY_ACCESSED,
    widgetType: widgetConstants.D2.RECENTLY_ACCESSED,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/recentlyaccessedtable.json",
    defaultTitle: lang.recentlyAccessedWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.recentlyAccessedWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.CHECKOUT,
    widgetType: widgetConstants.D2.CHECKOUT,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/checkedouttable.json",
    defaultTitle: lang.checkedOutWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.checkoutWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.ADMIN_CHECKOUT,
    widgetType: widgetConstants.D2.ADMIN_CHECKOUT,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/admin.checkedouttable.json",
    defaultTitle: lang.adminCheckedOutWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.adminCheckoutWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.MYSHARES,
    widgetType: widgetConstants.D2.MYSHARES,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/mysharestable.json",
    defaultTitle: lang.sharesWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.sharesWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.FAVORITES,
    defaultWidgetType: widgetConstants.DEFAULT.FAVORITES,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/favoritestable.json",
    defaultTitle: lang.favoritesWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.favoriteWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.INBOX,
    defaultWidgetType: widgetConstants.DEFAULT.TASKS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/taskstable.json",
    defaultTitle: lang.tasksWidgetTitle,
    validateConfig: checkWidgetExists.bind(this, lang.tasksWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.MY_WORKFLOWS,
    defaultWidgetType: widgetConstants.DEFAULT.MY_WORKFLOWS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/workflowstable.json",
    defaultTitle: lang.myWorkflowsWidgetTitle,
    validateConfig: workflowWidgetsValidator.bind(this, lang.myWorkflowsWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.ALL_WORKFLOWS,
    defaultWidgetType: widgetConstants.DEFAULT.ALL_WORKFLOWS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/workflowstable.json",
    defaultTitle: lang.allWorkflowsWidgetTitle,
    validateConfig: workflowWidgetsValidator.bind(this, lang.allWorkflowsWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.ADMIN_WORKFLOWS,
    defaultWidgetType: widgetConstants.DEFAULT.ADMIN_WORKFLOWS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/admin.workflowstable.json",
    defaultTitle: lang.adminWorkflowsWidgetTitle,
    validateConfig: workflowWidgetsValidator.bind(this, lang.myWorkflowsWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.SAVED_SEARCHES,
    widgetType: widgetConstants.DEFAULT.SAVED_SEARCH,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/savedsearchestable.json",
    defaultTitle: lang.savedSearchWidgetTitle,
    validateConfig: workflowWidgetsValidator.bind(this, lang.savedSearchWidgetMissing)
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.COLLECTIONS,
    widgetType: widgetConstants.DEFAULT.COLLECTIONS,
    defaultWidgetType: widgetConstants.DEFAULT.COLLECTIONS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/d2collections.perspective.json",
    defaultTitle: lang.collectionWidgetTitle
  }, {
    applicationScope: "my-collections",
    widgetType: widgetConstants.DEFAULT.COLLECTIONS,
    defaultWidgetType: widgetConstants.DEFAULT.COLLECTIONS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/mycollections.perspective.json",
    defaultTitle: lang.collectionWidgetTitle
  }, {
    applicationScope: "shared-collections",
    widgetType: widgetConstants.DEFAULT.COLLECTIONS,
    defaultWidgetType: widgetConstants.DEFAULT.COLLECTIONS,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/sharedcollections.perspective.json",
    defaultTitle: lang.collectionWidgetTitle
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.VIEWER,
    defaultTitle: "Viewer",
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/viewer.json"
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.ADMIN_AVIATOR,
    defaultTitle: lang.aviatorAdminWidgetTitle,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/aviator.admin.json",
    validateConfig: checkWidgetExists.bind(this, _.str.sformat(lang.notSupportedWidgetsInSV, lang.aviatorWidgetTitle))
  }, {
    applicationScope: widgetConstants.WIDGET_SCOPE.ADMIN_MIP,
    defaultTitle: lang.mipAdminWidgetTitle,
    perspectiveJson: "d2/utils/contexts/perspective/impl/perspectives/mip.admin.json",
    validateConfig: checkWidgetExists.bind(this, _.str.sformat(lang.notSupportedWidgetsInSV, lang.mipWidgetTitle))
  } ];
});
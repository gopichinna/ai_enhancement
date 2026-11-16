/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([

  'csui/models/audit/audit.collection',
  'csui/models/authenticated.user.node.permission',
  'csui/models/favorite2',
  'csui/models/favorite2group',
  'csui/models/favorite2groups',
  'csui/models/favorites2',
  'csui/models/favorite2column',
  'csui/models/favorite2columns',
  'csui/models/favorite.model',
  'csui/models/permission/nodepermission.model',
  'csui/models/permission/nodeuserpermissions',
  'csui/models/server.module/server.module.collection',
  'csui/models/specificnodemodel',
  'csui/models/version',
  'csui/models/view.state.model',
  'csui/models/perspective/personalization.model',
  'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver',
  'csui/models/memberancestorcollection',

  'csui/models/widget/widget.collection',
  'csui/models/widget/widget.model',
  'csui/models/zipanddownload/zipanddownload.preflight',
  'csui/models/zipanddownload/zipanddownload.stages',



  'i18n!csui/models/impl/nls/lang',

  'csui/utils/base',
  'csui/utils/mime.types',
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/defaultactionitems',
  'csui/utils/nodesprites',
  'csui/utils/node.info.sprites',
  'i18n!csui/utils/impl/nls/lang',
  'csui/utils/promoted.actionitems',
  'csui/utils/smart.nodes/smart.nodes',
  'csui/utils/perspective/perspective.util',
  'csui/utils/user.session/user.session',
  'csui/utils/exp.widget.config',

  'csui/utils/authenticators/core.authenticators',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator',


  'csui/models/audit/server.adaptor.mixin',
  'csui/models/node.createform/server.adaptor.mixin',
  'csui/models/permission/server.adaptor.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin',
  'csui/models/server.info/server.adaptor.mixin',
  'csui/models/permission/permission.precheck.server.adaptor',
  'csui/models/appliedcategories/category',
  'csui/models/appliedcategories/category.server.adaptor.mixin',
  'csui/models/appliedcategories/systemattributes.model',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.model',

  'csui/models/navigation.history'
], {});

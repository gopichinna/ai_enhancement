define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/utils/url',
  'd2/sdk/controls/form/form.view',
  'd2/sdk/controls/form/form.model',
  'd2/sdk/controls/form/form.converter',
  'd2/sdk/utils/rest.resources',
  'd2/sdk/utils/rest.linkrels',
  'i18n!<%= namespace %>/dialogs/manage.group/impl/nls/lang'
], function($, _, Url, FormView, FormModel, formConverter, RestResources, RestLinkrels, lang){
  'use strict';

  var GroupMembersFormView = FormView.extend({
    className: function () {
      var parentClassName = GroupMembersFormView.__super__.className || '';
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + ' d2-group-member-form';
    },

    constructor: function GroupMembersFormView(options) {
      options = options || {};

      options.topAlignedLabel = true;
      var self = this,
        dialog = this._createDialogJson(options);

      this.formSchema = formConverter.convertConfig(dialog, {
        actionMode: 'create',
        layoutMode: 'singleCol',
        extendFieldOptions: function (field) {
          field.getDataSourceCallBack = self.getUserData.bind(self, field);
        }
      });

      options.model = new FormModel(this.formSchema.propertiesConfig[0]);
      options.mode = 'create';

      GroupMembersFormView.__super__.constructor.call(this, options);

      this
        .listenTo(this, 'render:form', this.onFormRender)
        .listenTo(this, 'd2:change:form:field', this.collectMembers);
    },

    _createDialogJson: function(options) {
      var form = {
        'order': 1,
        'tabs': {
          'id': 'tab',
          'label': 'tab',
          'order': '1.1',
          'tab': {
            'id': 'gr_m',
            'label': '',
            'order': 1,
            'list': {
              'id': 'group_members',
              'label': lang.labelGroupMembers,
              'field_content_type': 'USER_OR_GROUP',
              'assistance_type': 'custom',
              'asynchronous': true,
              'order': 1,
              'autoselect_single': false,
              'condition_required': false,
              'o': options.initialMembers.map(function(member, index){
                return {v: member.get('name'), s: true, p: index};
              })
            }
          }
        }
      };

      return {
        dialog: {
          content: form
        }
      };
    },

    getUserData: function (/*field, attr, alpField*/) {
      var dfd = $.Deferred(),
        self = this/*,
        fieldOptions = alpField.options.ds,
        filter = (fieldOptions && fieldOptions.filter) || ''*/; //Just in case we want to send the user-typed filter to server. Here it is not used, kept as example though.

      if(!_.isEmpty(this.userData)) {
        dfd.resolve(_.map(_.keys(this.userData), function(k){ return {value: k, text: k};}));
      } else {
        var url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get('links'), RestLinkrels.SELF), '<%= namespace %>', 'users');
        $.ajax(self.options.initialMembers.connector.extendAjaxOptions({
          url: Url.appendQuery(url, Url.combineQueryString({inline: true})),
          success: function(resp) {
            var users = _.map(resp.entries||[], function(e){return e.content.properties;});
            var userOptions = [];
            var uDump = _.reduce(users, function(memo, val){
              userOptions.push({value: val['user_name'], text: val['user_name']});
              memo[val['user_name']] = val;
              return memo;
            }, {});
            self.setUserData(uDump);
            dfd.resolve(userOptions);
          },
          error: dfd.reject
        }));
      }

      return dfd.promise();
    },

    setUserData: function (usersDump) {
      if (usersDump && _.keys(usersDump).length > 0) {
        if (!this.userData) {
          this.userData = {};
        }
        _.extend(this.userData, usersDump);
      }
    },

    getFlatFormValueMap: function (map) {
      var me = this,
        properties = {};
      _.each(map, function (value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            _.each(_.keys(value[0]), function (k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          _.extend(properties, me.getFlatFormValueMap(value));
        }
      });
      return properties;
    },

    onFormRender: function() {
      this.trigger('members:init', this.getFlatFormValueMap(this.getValues())['group_members']);
    },

    collectMembers: function() {
      this.trigger('members:change', this.getFlatFormValueMap(this.getValues())['group_members']);
    }
  });

  return GroupMembersFormView;
});
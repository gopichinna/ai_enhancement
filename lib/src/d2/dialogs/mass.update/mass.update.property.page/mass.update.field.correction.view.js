/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/utils/mass.update.utils", "d2/dialogs/mass.update/mass.update.property.page/mass.update.field.correction.form.view", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.field.correction.form.css" ], function($, _, Backbone, Marionette, PerfectScrollingBehavior, MassUpdateUtils, MassUpdateCorrectionForm, lang) {
  var MassUpdateFieldCorrectionView = Marionette.ItemView.extend({
    className: "d2-mass-update-field-correction-view",
    template: false,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    constructor: function MassUpdateFieldCorrectionView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var region = new Marionette.Region({
        el: this.$el
      });
      var options = _.extend(this.options, {
        lastFormValues: this.lastFormValues
      });
      this.errorForm = new MassUpdateCorrectionForm(options);
      region.show(this.errorForm);
    },
    isValid: function() {
      return this.errorForm.isValid;
    },
    getNextButtonLabel: function() {
      return lang.nextLabel;
    },
    isNextButtonHidden: function() {
      return false;
    },
    getBackButtonTooltip: function() {
      return this.options.originatingView.options.massUpdateOptions.massUpdateConfigName;
    },
    getTitle: function() {
      return _.str.sformat(lang.errorUpdateTitle, this.options.control.schema.title);
    },
    onUpdateClick: function() {
      var valueMap = JSON.parse(JSON.stringify(this.options.formModel.get("options").initialFieldMultiValueMap[this.options.control.propertyId]));
      var formValues = this.errorForm.getValues(), control = this.options.control;
      this.lastFormValues = {};
      var orderAry = null;
      if (control.preOrder) {
        orderAry = control.preOrder;
      } else if (control.options.initialOrder) {
        orderAry = _.clone(control.options.initialOrder);
      }
      _.each(_.keys(formValues), function(oldVal) {
        var newVal = formValues[oldVal];
        if (_.isEmpty(newVal)) {
          newVal = "d2_mass_update_no_value";
        }
        if (valueMap[newVal]) {
          valueMap[newVal].objectIds = _.union(valueMap[newVal].objectIds, valueMap[oldVal].objectIds);
          valueMap[newVal].count = valueMap[newVal].objectIds.length;
          orderAry && orderAry.splice(_.indexOf(orderAry, oldVal), 1);
        } else {
          if (newVal === "d2_mass_update_no_value") {
            valueMap[newVal] = MassUpdateUtils.getNoValueCountConfig(valueMap[oldVal].totalCount);
            valueMap[newVal].objectIds = _.clone(valueMap[oldVal].objectIds);
            orderAry && orderAry.splice(_.indexOf(orderAry, oldVal), 1);
          } else {
            valueMap[newVal] = _.clone(valueMap[oldVal]);
            valueMap[newVal].category = null;
            valueMap[newVal].value = newVal;
            var option = null;
            var errorCorrectionControl = this.errorForm.form && this.errorForm.form.childrenByPropertyId[oldVal];
            if (errorCorrectionControl && errorCorrectionControl.selectOptions) {
              option = _.findWhere(errorCorrectionControl.selectOptions, {
                value: newVal
              });
            }
            valueMap[newVal].label = option && option.text;
            orderAry && (orderAry[_.indexOf(orderAry, oldVal)] = newVal);
          }
          valueMap[newVal].count = valueMap[newVal].objectIds.length;
        }
        orderAry && orderAry.push(oldVal);
        this.lastFormValues[oldVal] = {
          value: formValues[oldVal],
          label: valueMap[newVal].label
        };
        valueMap[oldVal].objectIds = [];
        valueMap[oldVal].hideInlineMenu = true;
        valueMap[oldVal].correctedToValue = newVal;
        control.preRemoved ? control.preRemoved.push(oldVal) : control.preRemoved = [ oldVal ];
      }, this);
      orderAry && (control.preOrder = orderAry);
      control.options.errorMultiFileCountData = valueMap;
      control.fieldView.errorList = [];
      this.options.originatingView.showUpdateFieldTableView({
        formModel: this.options.formModel,
        control: control,
        preventDestroy: true
      });
    }
  });
  return MassUpdateFieldCorrectionView;
});
/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "dctmw/utils/authenticators/session", "d2/utils/contexts/factories/display.types.factory" ], function(_, $, Backbone, Session, DisplayTypesFactory) {
  var typeAttributes;
  var TypeAttributeModel = Backbone.Model.extend({
    idAttribute: "name"
  });
  var TypeAttributeCollection = Backbone.Collection.extend({
    model: TypeAttributeModel,
    comparator: "label",
    deepClone: function() {
      return new TypeAttributeCollection(this.map(function(typeAttr) {
        return typeAttr.attributes;
      }));
    }
  });
  function getDisplayTypesCollection() {
    const context = Session.get().getContext();
    return context.getCollection(DisplayTypesFactory, {
      permanent: true,
      detached: true
    });
  }
  return {
    fetch: function() {
      var deferred = $.Deferred();
      if (typeAttributes) {
        deferred.resolve(typeAttributes.deepClone());
      } else {
        var displayTypes = getDisplayTypesCollection();
        displayTypes.ensureFetched({
          success: function() {
            var models = [];
            displayTypes.each(function(displayType) {
              var typeName = displayType.get("name"), typeLabel = displayType.get("label");
              models.push({
                name: typeName,
                label: typeLabel
              });
              var props = displayType.get("properties");
              _.each(props, function(prop) {
                models.push({
                  parent: typeName,
                  parentLabel: typeLabel,
                  name: typeName + "." + prop.name,
                  label: prop.label
                });
              });
            });
            typeAttributes = new TypeAttributeCollection(models);
            for (var i = 0; i < typeAttributes.length; i++) {
              var typeAttr = typeAttributes.at(i), label = typeAttr.get("label"), prevLabel = "", nextLabel = "";
              if (i > 0) {
                prevLabel = typeAttributes.at(i - 1).get("label");
              }
              if (i < typeAttributes.length - 1) {
                nextLabel = typeAttributes.at(i + 1).get("label");
              }
              if (typeAttr.get("parent") && label !== prevLabel && label !== nextLabel) {
                typeAttr.unset("parentLabel");
              }
            }
            deferred.resolve(typeAttributes.deepClone());
          },
          error: function(err) {
            deferred.reject(err);
          }
        });
      }
      return deferred.promise();
    }
  };
});